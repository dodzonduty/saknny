import { useContext } from "react";
import { LanguageContext } from "./LanguageContext";

export const useTranslation = () => {
  return useContext(LanguageContext);
};
