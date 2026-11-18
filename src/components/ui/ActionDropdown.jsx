"use client";

import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
} from "react";
import { createPortal } from "react-dom";

const VIEWPORT_PADDING = 8;
const MENU_GAP = 4;

export default function ActionDropdown({
  open,
  onOpenChange,
  trigger,
  children,
  triggerClassName = "",
  menuClassName = "",
  wrapperClassName = "",
  ariaLabel = "Open actions",
  closeOnSelect = true,
}) {
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const animationFrameRef = useRef(null);
  const onOpenChangeRef = useRef(onOpenChange);
  const menuId = useId();

  useLayoutEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  const updatePosition = useCallback(() => {
    const triggerElement = triggerRef.current;
    const menuElement = menuRef.current;
    if (!triggerElement || !menuElement) return;

    const triggerRect = triggerElement.getBoundingClientRect();
    const menuRect = menuElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const triggerIsOutsideViewport =
      triggerRect.width === 0 ||
      triggerRect.height === 0 ||
      triggerRect.bottom <= 0 ||
      triggerRect.top >= viewportHeight ||
      triggerRect.right <= 0 ||
      triggerRect.left >= viewportWidth;

    if (triggerIsOutsideViewport) {
      menuElement.style.display = "none";
      return;
    }

    menuElement.style.display = "block";

    const availableBelow = viewportHeight - triggerRect.bottom - VIEWPORT_PADDING;
    const availableAbove = triggerRect.top - VIEWPORT_PADDING;
    const openUpwards =
      availableBelow < menuRect.height + MENU_GAP &&
      availableAbove > availableBelow;

    const preferredTop = openUpwards
      ? triggerRect.top - menuRect.height - MENU_GAP
      : triggerRect.bottom + MENU_GAP;
    const maxTop = Math.max(
      VIEWPORT_PADDING,
      viewportHeight - menuRect.height - VIEWPORT_PADDING,
    );
    const top = Math.min(Math.max(preferredTop, VIEWPORT_PADDING), maxTop);

    const preferredLeft = triggerRect.right - menuRect.width;
    const maxLeft = Math.max(
      VIEWPORT_PADDING,
      viewportWidth - menuRect.width - VIEWPORT_PADDING,
    );
    const left = Math.min(
      Math.max(preferredLeft, VIEWPORT_PADDING),
      maxLeft,
    );

    menuElement.style.top = `${Math.round(top)}px`;
    menuElement.style.left = `${Math.round(left)}px`;
    menuElement.style.maxHeight = `${Math.max(0, viewportHeight - VIEWPORT_PADDING * 2)}px`;
    menuElement.style.maxWidth = `${Math.max(0, viewportWidth - VIEWPORT_PADDING * 2)}px`;
    menuElement.style.transformOrigin = openUpwards ? "bottom right" : "top right";
    menuElement.dataset.placement = openUpwards ? "top" : "bottom";
  }, []);

  const schedulePositionUpdate = useCallback(() => {
    if (animationFrameRef.current !== null) return;
    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = null;
      updatePosition();
    });
  }, [updatePosition]);

  useLayoutEffect(() => {
    if (!open) return;

    updatePosition();

    const handlePointerDown = (event) => {
      const triggerRect = triggerRef.current?.getBoundingClientRect();
      if (!triggerRect || triggerRect.width === 0 || triggerRect.height === 0) {
        return;
      }

      const target = event.target;
      if (
        target &&
        (triggerRef.current?.contains(target) || menuRef.current?.contains(target))
      ) {
        return;
      }
      onOpenChangeRef.current(false);
    };

    const handleKeyDown = (event) => {
      const triggerRect = triggerRef.current?.getBoundingClientRect();
      if (!triggerRect || triggerRect.width === 0 || triggerRect.height === 0) {
        return;
      }

      if (event.key === "Escape") {
        onOpenChangeRef.current(false);
        triggerRef.current?.focus();
      }
    };

    const handleScroll = (event) => {
      if (menuRef.current && menuRef.current.contains(event.target)) {
        return;
      }
      onOpenChangeRef.current(false);
    };

    const handleResize = () => {
      onOpenChangeRef.current(false);
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(schedulePositionUpdate);
    if (triggerRef.current) resizeObserver?.observe(triggerRef.current);
    if (menuRef.current) resizeObserver?.observe(menuRef.current);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
      resizeObserver?.disconnect();
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [open, schedulePositionUpdate, updatePosition]);

  const menu =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            data-action-dropdown-menu="true"
            onClick={(event) => {
              event.stopPropagation();
              if (closeOnSelect) onOpenChange(false);
            }}
            className={`fixed z-[2147483000] overflow-y-auto ${menuClassName}`}
          >
            {children}
          </div>,
          document.body,
        )
      : null;

  return (
    <span
      className={`inline-flex ${wrapperClassName}`}
      data-action-dropdown-root="true"
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onOpenChange(!open);
        }}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {menu}
    </span>
  );
}
