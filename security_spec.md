# Security Specification — Carta Inclusiva Vicuña Mackenna

## 1. Data Invariants
1. Un documento en `/comercios/{comercioId}` solo puede ser creado, modificado o eliminado por un Administrador Municipal (`isAdmin()`). Nunca contiene contraseñas ni correos personales.
2. Las contraseñas asignadas por la Municipalidad se aíslan en `/comercios_credentials/{comercioId}` y únicamente `isAdmin()` puede leerlas o escribirlas.
3. Un usuario autenticado con Google verificado (`email_verified == true`) solo puede vincularse como miembro de un comercio (`/comercios/{comercioId}/members/{memberUid}`) si `memberUid == request.auth.uid`, el comercio existe y `incoming().accessCode` coincide exactamente con `/comercios_credentials/{comercioId}.data.accessCode`.
4. Un plato (`/comercios/{comercioId}/platos/{platoId}`) o pictograma propio (`/comercios/{comercioId}/pictogramasCustom/{pictoId}`) solo puede ser creado, actualizado o eliminado si `isAdmin()` o si el usuario es miembro verificado en `/comercios/{comercioId}/members/{request.auth.uid}`, y `incoming().comercioId == comercioId`.
5. Todo `createdAt` y `updatedAt` debe coincidir con `request.time`; `createdAt` es inmutable tras su creación.
6. Todos los IDs de ruta y campos string/array respetan límites de tamaño y expresiones regulares para evitar inyección o agotamiento de recursos.

## 2. The "Dirty Dozen" Attack Payloads (All Must Return PERMISSION_DENIED)
1. **Unauthenticated Commerce Create**: Usuario anónimo intenta crear `/comercios/com-evil`.
2. **Self-Admin Escalation**: Usuario verificado no admin intenta crear `/admins/{ownUid}`.
3. **Password Scraping**: Usuario verificado no admin intenta leer `/comercios_credentials/com-1`.
4. **Wrong Access Code Join**: Usuario intenta crear `/comercios/com-1/members/{ownUid}` con `accessCode: "wrongpass"`.
5. **Impersonate Other Member**: Usuario `uidA` intenta crear `/comercios/com-1/members/uidB` con contraseña válida.
6. **Shadow Field Injection on Plato**: Miembro válido crea plato con campo extra `isFeaturedHack: true` (bloqueado por `keys().hasOnly(...)`).
7. **Cross-Commerce Dish Poisoning**: Miembro de `com-1` intenta crear `/comercios/com-2/platos/pla-x`.
8. **Mismatched `comercioId` on Dish**: Miembro de `com-1` crea `/comercios/com-1/platos/pla-x` con `comercioId: "com-2"`.
9. **Client-Spoofed Timestamp**: Miembro válido crea plato con `createdAt` distinto de `request.time`.
10. **Immutable `createdAt` Tampering**: Miembro válido actualiza plato intentando alterar `createdAt`.
11. **Oversized Array/String Attack**: Miembro válido intenta guardar `pictogramas` con 50 elementos (> 25) o `nombre` de 500 caracteres (> 160).
12. **Unverified Email Spoofing**: Usuario con token donde `email == "discapacidadgovmvm@gmail.com"` pero `email_verified == false` intenta escribir `/comercios/com-x`.
