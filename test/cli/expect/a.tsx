/* eslint-disable react/jsx-curly-brace-presence */
/* eslint-disable no-console */
// @ts-nocheck
import React from "react";
import { i18n } from "./myI18n/index.tsx";

export const name = i18n.intl.formatMessage({
  id: "key0001",
  defaultMessage: "你好",
});

export default function Component() {
  return (
    <div>
      {i18n.intl.formatMessage({
        id: "key0002",
        defaultMessage: "再见",
      })}
    </div>
  );
}
