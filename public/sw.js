// Service worker propio, sin envoltorio de PWA (PLAN.md §0.4.1).
// Hace tres cosas: recibir avisos, abrirlos, y servir una caché mínima.

self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", (evento) => evento.waitUntil(self.clients.claim()))

/**
 * Muestra un aviso. La carga nunca trae el contenido del mensaje: solo el
 * título y, como mucho, una línea de contexto (RF-4.4).
 */
self.addEventListener("push", (evento) => {
  let datos = { titulo: "PairApp", cuerpo: undefined, url: "/hoy" }
  try {
    if (evento.data) datos = { ...datos, ...evento.data.json() }
  } catch {
    // Si la carga no es JSON, se muestra el aviso genérico.
  }

  evento.waitUntil(
    self.registration.showNotification(datos.titulo, {
      body: datos.cuerpo,
      icon: "/icono-192.png",
      badge: "/icono-192.png",
      data: { url: datos.url },
      tag: "pairapp",
    }),
  )
})

/** Al tocar el aviso, abre la app en la pantalla que corresponda. */
self.addEventListener("notificationclick", (evento) => {
  evento.notification.close()
  const destino = evento.notification.data?.url || "/hoy"

  evento.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) => {
      for (const ventana of ventanas) {
        if ("focus" in ventana) {
          ventana.navigate(destino)
          return ventana.focus()
        }
      }
      return self.clients.openWindow(destino)
    }),
  )
})
