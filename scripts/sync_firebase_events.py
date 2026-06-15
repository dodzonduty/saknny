import logging
import os
import signal
import sys
import threading
import time
from datetime import datetime, timezone
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("sync_firebase_events")

# Ensure the backend directory is in the path
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from backend.app.core.config import settings
from backend.app.core.database import SessionLocal
from backend.app.models.firebase_sync import FirebaseSyncCursor, FirebaseSyncFailure
from backend.app.services.firebase import _ensure_firebase_initialized, _get_firestore_client
from backend.app.services.firebase_sync_handlers import HANDLER_REGISTRY


shutdown_event = threading.Event()


def signal_handler(signum, frame):
    logger.info("Signal received, initiating graceful shutdown...")
    shutdown_event.set()


def update_cursor(db, collection_name: str, last_event_id: str, occurred_at: datetime):
    cursor = db.query(FirebaseSyncCursor).filter(FirebaseSyncCursor.collection_name == collection_name).first()
    if not cursor:
        cursor = FirebaseSyncCursor(
            collection_name=collection_name,
            last_processed_at=occurred_at,
            last_event_id=last_event_id
        )
        db.add(cursor)
    else:
        # only update if newer
        if not cursor.last_processed_at or occurred_at >= cursor.last_processed_at:
            cursor.last_processed_at = occurred_at
            cursor.last_event_id = last_event_id
    db.commit()


def process_event(event_doc: dict):
    event_id = event_doc.get("event_id")
    event_type = event_doc.get("event_type")
    
    if event_type not in HANDLER_REGISTRY:
        logger.warning(f"No handler found for event type: {event_type}")
        return False, f"Unknown event type: {event_type}"

    handler = HANDLER_REGISTRY[event_type]
    db = SessionLocal()
    try:
        entity_type, entity_id = handler(event_doc, db)
        db.commit()
        return True, {"entity_type": entity_type, "entity_id": entity_id}
    except Exception as e:
        db.rollback()
        logger.exception(f"Error processing event {event_id}: {e}")
        
        # Log failure
        try:
            failure = db.query(FirebaseSyncFailure).filter(FirebaseSyncFailure.event_id == event_id).first()
            if not failure:
                failure = FirebaseSyncFailure(
                    event_id=event_id,
                    event_type=event_type,
                    error_message=str(e),
                )
                db.add(failure)
            else:
                failure.error_message = str(e)
                failure.retry_count += 1
                failure.last_retry_at = datetime.now(timezone.utc)
            db.commit()
        except Exception as inner_e:
            logger.error(f"Failed to record sync failure: {inner_e}")
            
        return False, str(e)
    finally:
        db.close()


def on_snapshot(doc_snapshot, changes, read_time):
    # This runs in a background thread managed by grpc/firebase-admin
    for doc in doc_snapshot:
        data = doc.to_dict()
        event_id = doc.id
        logger.info(f"Received event {event_id} (sync_status: {data.get('sync_status')})")
        
        if data.get("sync_status") != "pending":
            continue

        logger.info(f"========== [SYNC WORKER FLOW START] ==========")
        logger.info(f"[SYNC WORKER] Step 1: Detected pending event {event_id} of type {data.get('event_type')}")
        success, result = process_event(data)
        
        # Update Firestore
        try:
            firestore_db = _get_firestore_client()
            collection_name = getattr(settings, "FIRESTORE_EVENTS_COLLECTION", "mobile_event_log")
            doc_ref = firestore_db.collection(collection_name).document(event_id)
            
            if success:
                logger.info(f"[SYNC WORKER] Step 2: Successfully wrote {result.get('entity_type')} to PostgreSQL (ID: {result.get('entity_id')})")
                doc_ref.update({
                    "sync_status": "synced",
                    "synced_at": datetime.now(timezone.utc),
                    "pg_entity_type": result.get("entity_type"),
                    "pg_entity_id": result.get("entity_id")
                })
                logger.info(f"[SYNC WORKER] Step 3: Marked event {event_id} as 'synced' in Firestore.")
                
                # Update cursor
                occurred_at = data.get("occurred_at")
                if occurred_at:
                    db = SessionLocal()
                    try:
                        update_cursor(db, collection_name, event_id, occurred_at)
                    finally:
                        db.close()
            else:
                doc_ref.update({
                    "sync_status": "failed",
                })
        except Exception as e:
            logger.error(f"Failed to update Firestore status for {event_id}: {e}")


def main():
    if not settings.FIREBASE_ENABLED:
        logger.error("Firebase is not enabled in settings.")
        return

    logger.info("Initializing Firebase Admin SDK...")
    _ensure_firebase_initialized()
    firestore_db = _get_firestore_client()

    collection_name = getattr(settings, "FIRESTORE_EVENTS_COLLECTION", "mobile_event_log")
    logger.info(f"Listening for events on '{collection_name}' collection...")
    
    col_query = firestore_db.collection(collection_name).where(filter=firestore.FieldFilter("sync_status", "==", "pending"))
    col_watch = col_query.on_snapshot(on_snapshot)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        while not shutdown_event.is_set():
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received.")
    
    logger.info("Unsubscribing from Firestore...")
    col_watch.unsubscribe()
    logger.info("Sync worker shutdown complete.")


if __name__ == "__main__":
    from firebase_admin import firestore
    main()
