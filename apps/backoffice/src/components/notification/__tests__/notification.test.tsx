import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Notification } from "../index";
import { AlertColor } from "@mui/material";

const BO_IO_NOTIFICATION = "bo-io-notification";
const BO_IO_NOTIFICATION_TITLE = "bo-io-notification-title";

let severity: AlertColor = "success";
let title: string = "titleTest";
let message: string = "messageTest";

const getNotificationComponent = () => (
  <Notification title={title} message={message} severity={severity} />
);

const resetProps = () => {
  severity = "success";
  title = "titleTest";
  message = "messageTest";
};

// needed to clean document (react dom)
afterEach(() => {
  cleanup();
  resetProps();
});

describe("[Notification] Component", () => {
  it("should be rendered", () => {
    render(getNotificationComponent());

    const notification = screen.getByTestId(BO_IO_NOTIFICATION);

    expect(notification).toBeDefined();
  });

  it("should't render title", () => {
    title = "";
    render(getNotificationComponent());

    const alertTitle = screen.queryByTestId(BO_IO_NOTIFICATION_TITLE);

    expect(alertTitle).toBeNull();
  });
});
