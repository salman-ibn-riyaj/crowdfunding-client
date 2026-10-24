"use client";

import { useEffect, useRef, useState } from "react";
import { FiBell, FiX } from "react-icons/fi";
import { notificationsApi } from "../lib/notifications-api";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationPopup({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const popupRef = useRef(null);

  // Fetch unread count periodically
  useEffect(() => {
    if (!user?.email) return;

    const fetchUnreadCount = async () => {
      try {
        const res = await notificationsApi.getUnreadCount();
        setUnreadCount(res.count || 0);
      } catch (err) {
        console.error("Failed to fetch unread count:", err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [user?.email]);

  // Fetch notifications when popup opens
  useEffect(() => {
    if (!isOpen || !user?.email) return;

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await notificationsApi.getNotifications();
        setNotifications(res.notifications || []);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isOpen, user?.email]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Mark all as read when popup opens
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      notificationsApi.markAllRead()
        .then(() => setUnreadCount(0))
        .catch((err) => console.error("Failed to mark as read:", err));
    }
  }, [isOpen, unreadCount]);

  return (
    <div className="notification-container" ref={popupRef}>
      <button
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        className="notification-icon-button"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <FiBell aria-hidden="true" />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-popup">
          <header className="notification-popup__header">
            <h3>Notifications</h3>
            <button
              aria-label="Close notifications"
              className="notification-popup__close"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <FiX aria-hidden="true" />
            </button>
          </header>

          <div className="notification-popup__content">
            {loading ? (
              <p className="notification-popup__loading">Loading notifications...</p>
            ) : notifications.length === 0 ? (
              <p className="notification-popup__empty">No notifications yet.</p>
            ) : (
              <ul className="notification-list">
                {notifications.map((notification) => (
                  <li
                    key={notification._id}
                    className={`notification-item${!notification.read ? " notification-item--unread" : ""}`}
                  >
                    <p className="notification-item__message">{notification.message}</p>
                    <div className="notification-item__meta">
                      <time className="notification-item__time">{formatDate(notification.time)}</time>
                      {notification.actionRoute && (
                        <a
                          className="notification-item__action"
                          href={notification.actionRoute}
                          onClick={() => setIsOpen(false)}
                        >
                          View
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
