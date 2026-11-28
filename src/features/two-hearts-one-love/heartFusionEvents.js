
const listeners = new Set();

export function subscribeHeartFusion(listener) {
  if (typeof listener !== "function") {
    return () => {};
  }

  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function publishHeartFusion(event) {
  if (!event || event.type !== "heart_fusion_updated") {
    return;
  }

  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch (error) {
      console.warn("Heart Fusion event error:", error);
    }
  });
}
