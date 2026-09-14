/** Spanish starter text for the seven policy pages. Mirrors legal-en.ts. */
export const LEGAL_ES: Record<string, { title: string; content: string; seoDescription: string }> = {
  terms: {
    title: 'Condiciones de uso y de venta',
    seoDescription: 'Las condiciones aplicables al uso del sitio web de Mian Dubai y a cualquier pedido que realice con nosotros.',
    content: `Estas condiciones se aplican al uso de este sitio web y a cualquier pedido que realice con {{brandName}}{{#if legalEntityName}} ({{legalEntityName}}){{/if}} («Mian Dubai», «nosotros»). Léalas antes de utilizar el sitio o de realizar un pedido.

## 1. Uso de este sitio web

Puede navegar y utilizar este sitio con fines personales y no comerciales. Se compromete a no hacer un uso indebido del mismo: por ejemplo, intentando acceder sin autorización, interfiriendo en su funcionamiento, extrayendo datos a una escala que degrade el servicio para otros, o utilizándolo con fines ilícitos.

El contenido de este sitio, incluidos textos, diseño, fotografías, gráficos y el nombre y logotipo de Mian Dubai, nos pertenece o pertenece a nuestros licenciantes. No puede copiarlo ni reutilizarlo con fines comerciales sin nuestro permiso por escrito.

## 2. Cómo se realizan los pedidos

Actualmente no aceptamos pagos en línea. Los pedidos se organizan directamente con nosotros, y el sitio le dirigirá a un canal de mensajería o contacto para completar su solicitud.

Añadir artículos a la bolsa, o enviarnos una lista de artículos, constituye una **solicitud**, no una compra concluida. Un pedido solo existe una vez que le hayamos confirmado:

- la disponibilidad de los artículos;
- el precio final, incluidos los gastos de envío e impuestos aplicables;
- la dirección de entrega y el plazo estimado;
- la forma en que se realizará el pago.

Podemos rechazar o cancelar una solicitud antes de su confirmación: por ejemplo, si un artículo se ha agotado, si ha habido un error de precio o descripción, o si no podemos entregar en la dirección indicada.

## 3. Precios e información de producto

Los precios se muestran en la moneda que haya seleccionado. Cuando junto a un precio en USD se muestra un importe en AED, este puede haberse convertido con un tipo de referencia interno y es solo orientativo; el importe confirmado con usted al realizar el pedido es el que se aplica.

Describimos nuestras fragancias con cuidado. Los colores, el envase y la presentación pueden variar ligeramente respecto a las imágenes debido a la fotografía, la iluminación y su pantalla. Los tamaños y las concentraciones se indican en cada ficha de producto.

## 4. Disponibilidad y entrega

Actualmente entregamos en: {{shippingRegion}}. Los plazos se expresan en días hábiles y son estimaciones, no garantías. Consulte nuestra Política de envío y entrega.

## 5. Devoluciones

Sus derechos y el procedimiento se detallan en nuestra Política de devoluciones y reembolsos. Nada en estas condiciones limita un derecho que la legislación aplicable no permita limitar.

## 6. Seguridad del producto

Las fragancias son de uso externo exclusivamente y pueden contener ingredientes que causen sensibilidad en algunas personas. Lea nuestro Aviso de seguridad del producto y la información del envase, que siempre prevalece sobre lo indicado en este sitio.

## 7. Sus datos

Tratamos los datos personales según se describe en nuestra Política de privacidad.

## 8. Disponibilidad del sitio

Procuramos mantener el sitio disponible, pero podemos suspender, retirar o modificar cualquier parte del mismo —incluidos productos concretos— sin previo aviso. No garantizamos que el sitio esté siempre disponible ni libre de errores.

## 9. Nuestra responsabilidad

En la máxima medida permitida por la legislación aplicable, no somos responsables de pérdidas indirectas o derivadas, lucro cesante, ni de pérdidas resultantes del uso o la imposibilidad de uso de este sitio.

Nada en estas condiciones excluye ni limita nuestra responsabilidad cuando hacerlo sería ilícito. Esto incluye la responsabilidad por fallecimiento o daños personales causados por negligencia, por fraude o declaración fraudulenta, y cualquier derecho legal relativo a los productos vendidos que no pueda excluirse legalmente.

## 10. Cambios en estas condiciones

Podemos actualizar estas condiciones. La versión publicada en esta página en el momento de realizar su pedido es la que se aplica a ese pedido. La fecha de entrada en vigor figura al principio de esta página.

## 11. Legislación aplicable

Estas condiciones se rigen por las leyes del Estado de {{governingLawState}}, Estados Unidos, sin atender a sus normas sobre conflicto de leyes.{{#if governingLawVenue}} Los tribunales situados en {{governingLawVenue}} serán competentes para cualquier controversia derivada de las mismas.{{/if}} Esto no le priva de la protección de las normas imperativas de consumo aplicables en su lugar de residencia.

## 12. Contacto

{{#if supportEmail}}Correo electrónico: {{supportEmail}}{{/if}}
{{#if phone}}Teléfono: {{phone}}{{/if}}
{{#if businessAddress}}Dirección: {{businessAddress}}{{/if}}

Si no aparece ningún dato anterior, utilice el formulario de nuestra página de Contacto.`,
  },

  privacy: {
    title: 'Política de privacidad',
    seoDescription: 'Cómo Mian Dubai recopila, utiliza y protege los datos personales, incluida la información para residentes de California.',
    content: `Esta política explica qué datos personales recopila {{brandName}} a través de este sitio, por qué, y qué opciones tiene usted. Está redactada teniendo en cuenta la California Online Privacy Protection Act (CalOPPA), dado que actualmente atendemos a clientes en: {{shippingRegion}}.

## 1. Categorías de datos personales que recopilamos

**Datos que usted nos facilita directamente**

- **Formulario de contacto:** su nombre, dirección de correo electrónico, un teléfono opcional, el asunto seleccionado y el contenido de su mensaje.
- **Boletín:** su dirección de correo electrónico y el idioma de navegación, si decide suscribirse.
- **Consultas de pedido:** cuando continúa un pedido por un canal de mensajería, la información que nos envía allí, normalmente su nombre, dirección de entrega y detalles del pedido.

**Datos recopilados automáticamente**

- **Datos técnicos y de seguridad:** su dirección IP, tipo y versión de navegador, información del dispositivo y del sistema operativo, las páginas solicitadas y la fecha y hora de cada petición. Los registros del servidor y de la aplicación los conservan para mantener el servicio disponible y detectar abusos.
- **Preferencias guardadas en su navegador:** su idioma, su moneda y el contenido de su bolsa. Se guardan en su propio dispositivo y se describen en nuestro Aviso sobre cookies y seguimiento.

**No** solicitamos, y este sitio no recopila, números de tarjeta ni datos bancarios. En este sitio no existe ningún formulario de pago en línea.

## 2. Origen de los datos

Recopilamos datos directamente de usted, de forma automática desde su dispositivo al navegar y, cuando procede, de los registros de seguridad de nuestros proveedores de alojamiento e infraestructura.

## 3. Para qué los utilizamos

- Para responder a su consulta y organizar, confirmar y entregar su pedido.
- Para enviarle nuestro boletín, únicamente si lo ha solicitado.
- Para mantener la seguridad del sitio, prevenir abusos y diagnosticar problemas técnicos.
- Para conservar los registros que debemos conservar y para ejercer o defender acciones legales.

## 4. Con quién los compartimos

No vendemos datos personales ni los compartimos con terceros para sus propios fines de marketing.

Solo los compartimos con:

- **Proveedores de servicios** que alojan el sitio, almacenan nuestros datos y entregan nuestros pedidos, actuando conforme a nuestras instrucciones.
- **Plataformas de mensajería** a través de las cuales decida contactarnos. Cuando continúa una conversación en un servicio de terceros, dicho servicio trata su mensaje conforme a su propia política de privacidad, no la nuestra.
- **Autoridades o asesores**, cuando la ley lo exija o sea necesario para ejercer o defender acciones legales.

## 5. Cuánto tiempo los conservamos

- Mensajes de contacto: mientras gestionamos su consulta y durante un periodo razonable posterior, a efectos de registro.
- Suscripciones al boletín: hasta que cancele la suscripción o nos pida que le eliminemos.
- Registros de seguridad y de servidor: durante un periodo breve, adecuado a la supervisión de seguridad.

Eliminamos o anonimizamos los datos cuando ya no tenemos motivo para conservarlos.

## 6. Seguridad

Aplicamos medidas técnicas y organizativas adecuadas al riesgo: conexiones cifradas, credenciales de administración con hash, controles de acceso a nuestras herramientas de administración y almacenamiento de las direcciones IP en forma de hash en lugar de en claro en los registros que conservamos. Ningún método de transmisión o almacenamiento es completamente seguro y no podemos garantizar una seguridad absoluta.

## 7. Sus opciones

Puede pedirnos que:

- confirmemos qué datos personales tenemos sobre usted;
- corrijamos información inexacta;
- eliminemos información que ya no necesitemos conservar;
- dejemos de enviarle mensajes comerciales.

Contáctenos con los datos de la sección 12 describiendo su solicitud. Es posible que necesitemos información para verificar su identidad antes de actuar, para no revelar sus datos a otra persona.

## 8. Derechos en California

Si reside en California, la CalOPPA nos obliga a indicar las categorías de información personal identificable que recopilamos y cómo la utilizamos —secciones 1 a 5— y a explicar cómo le informamos de los cambios, lo que se recoge en la sección 11.

Los derechos adicionales previstos en la California Consumer Privacy Act (CCPA/CPRA) se aplican únicamente a las empresas que alcanzan los umbrales fijados en dicha ley. Si {{brandName}} llega a alcanzarlos, publicaremos la información y los mecanismos de solicitud adicionales exigidos y actualizaremos esta sección. Mientras tanto, atenderemos de buena fe cualquier solicitud razonable sobre sus datos.

## 9. «Do Not Track» y señales del navegador

Algunos navegadores envían una señal «Do Not Track» o Global Privacy Control. No existe un estándar común sobre cómo deben responder los sitios a estas señales. Este sitio no utiliza publicidad de terceros ni analítica entre sitios, por lo que no hay seguimiento entre sitios que dicha señal pudiera desactivar. Si en el futuro introdujéramos algún seguimiento no esencial, actualizaríamos esta política y ofreceríamos una forma de dar o denegar el consentimiento previamente.

## 10. Menores

Esta tienda no está dirigida a menores de 13 años y no recopilamos conscientemente sus datos personales. Si cree que un menor nos ha facilitado datos, contáctenos y los eliminaremos.

## 11. Cambios en esta política

Podemos actualizar esta política. La fecha de entrada en vigor al principio de la página indica su última modificación. Los cambios sustanciales se reflejarán en esta página antes de surtir efecto.

## 12. Contacto

{{#if privacyContactEmail}}Consultas sobre privacidad: {{privacyContactEmail}}{{/if}}
{{#if supportEmail}}Correo electrónico: {{supportEmail}}{{/if}}
{{#if phone}}Teléfono: {{phone}}{{/if}}
{{#if businessAddress}}Dirección: {{businessAddress}}{{/if}}

Si no aparece ningún dato anterior, utilice el formulario de nuestra página de Contacto.`,
  },

  shipping: {
    title: 'Política de envío y entrega',
    seoDescription: 'Dónde entrega actualmente Mian Dubai, cuánto tarda normalmente la entrega y cómo se confirma.',
    content: `## Dónde entregamos

Actualmente entregamos en: **{{shippingRegion}}**.

Si se encuentra fuera de esta zona y desea realizar un pedido, contáctenos. Le diremos con honestidad si podemos ayudarle, en lugar de aceptar un pedido que no podríamos cumplir.

## Plazo de entrega estimado

Nuestra estimación actual es de **{{deliveryMinDays}} a {{deliveryMaxDays}} días hábiles** desde la confirmación de su pedido.

Los días hábiles son de lunes a viernes, excluidos los festivos. Algunos productos pueden mostrar una estimación distinta en su ficha, que en ese caso prevalece.

Se trata de una **estimación, no de una fecha de entrega garantizada.** La entrega puede tardar más de lo estimado por:

- retrasos o incidencias del transportista;
- condiciones meteorológicas u otras circunstancias ajenas a nuestro control;
- datos de dirección incompletos o incorrectos;
- cuestiones operativas como comprobaciones de stock o volumen de preparación;
- días festivos.

## Tiempo de preparación

Cuando un producto requiere preparación antes del envío, ese plazo se indica en su ficha. Si no se indica ninguno, la estimación anterior es el plazo completo.

## Cómo se organiza la entrega

Dado que en este sitio no se cobra, la dirección de entrega, el plazo y cualquier gasto de envío se confirman directamente con usted antes de finalizar el pedido. Revise la dirección con atención en ese momento: no podemos redirigir un paquete que el transportista ya haya recogido.

{{#if freeShippingEnabled}}
## Gastos de envío

Actualmente se aplica envío gratuito a los pedidos que cumplan los requisitos. El importe exacto, o la confirmación de que no hay gastos, se le comunica antes de confirmar su pedido.
{{/if}}

## Disponibilidad

Los niveles de stock mostrados reflejan nuestros registros en el momento de cargar la página. La disponibilidad se vuelve a comprobar al confirmar su pedido. Si un artículo se ha agotado entretanto, se lo comunicaremos con prontitud y le ofreceremos una alternativa o cancelaremos esa línea.

## Si algo va mal

Si su pedido no ha llegado en un plazo razonable tras la estimación, o si llega dañado, contáctenos{{#if supportEmail}} en {{supportEmail}}{{/if}} lo antes posible. Conserve el embalaje, ya que el transportista puede necesitar inspeccionarlo.

Nuestra Política de devoluciones y reembolsos explica los siguientes pasos para artículos dañados, defectuosos o incorrectos.`,
  },

  returns: {
    title: 'Política de devoluciones y reembolsos',
    seoDescription: 'Cómo solicitar una devolución o un reembolso a Mian Dubai, incluidas las reglas de higiene para fragancias abiertas.',
    content: `Queremos que su fragancia le satisfaga. Esta política explica cuándo puede devolver un artículo y cómo iniciar el proceso.

## Plazo para solicitar una devolución

Contáctenos en un plazo de **{{returnWindowDays}} días** desde la recepción de su pedido si desea devolver algo. Indíquenos los datos del pedido y cuál es el problema.

## Lo que siempre resolveremos

Con independencia de que el artículo se haya abierto o no, sustituiremos o reembolsaremos un producto que sea:

- **el artículo equivocado** — distinto del confirmado en su pedido;
- **dañado durante el transporte**;
- **defectuoso** — por ejemplo, un vaporizador averiado, un frasco con fugas o un producto que no está en el estado que debería.

Comuníquenoslo en cuanto lo detecte y conserve el embalaje si es posible. Las fotografías suelen ayudar a resolver estos casos con rapidez.

## Artículos sin abrir

Un artículo sin abrir, en su embalaje original precintado y en condiciones de reventa, puede devolverse dentro del plazo indicado.

## Fragancias abiertas o usadas

La fragancia es un producto en el que la higiene y la seguridad importan. **Una vez abierto o usado un frasco, por lo general no podemos aceptarlo de vuelta para su reventa** y podemos rechazar la devolución por ese motivo.

Esta restricción no se aplica a las situaciones enumeradas en «Lo que siempre resolveremos» y no afecta a ningún derecho que la legislación aplicable no permita renunciar, incluidos los derechos relativos a productos que no sean de calidad satisfactoria, no se correspondan con su descripción o no sean seguros.

## Cómo iniciar una devolución

1. Contáctenos{{#if supportEmail}} en {{supportEmail}}{{/if}} dentro del plazo, con los datos de su pedido y una descripción del problema.
2. Le confirmaremos si el artículo cumple los requisitos y le indicaremos cómo devolverlo. **Espere a esa confirmación antes de enviar nada**: le facilitaremos entonces los datos correctos de devolución.
3. Una vez recibido e inspeccionado el artículo, le confirmaremos el resultado.

## Reembolsos

Cuando proceda un reembolso, se realizará por el mismo medio utilizado para pagar el pedido, salvo que acordemos otra cosa. Le informaremos cuando se haya emitido; el tiempo que tarde en llegarle dependerá de su banco o proveedor de pago.

## Gastos de devolución

Cuando la devolución se deba a un error nuestro —artículo equivocado, dañado o defectuoso— asumimos los gastos de devolución. En los demás casos, dichos gastos corren normalmente por su cuenta y se lo indicaremos con claridad antes de que envíe nada.

## Preguntas

{{#if supportEmail}}Correo electrónico: {{supportEmail}}{{/if}}
{{#if phone}}Teléfono: {{phone}}{{/if}}

O utilice el formulario de nuestra página de Contacto.`,
  },

  'product-safety': {
    title: 'Seguridad del producto y aviso sobre fragancias',
    seoDescription: 'Información de seguridad para el uso de las fragancias de Mian Dubai: sensibilidad, conservación e inflamabilidad.',
    content: `Lea esta página junto con la información impresa en el envase del producto. **El envase y la etiqueta suministrados con el producto siempre prevalecen sobre esta página.**

## Uso general

- Las fragancias son de **uso externo exclusivamente**.
- Siga las instrucciones y advertencias de la etiqueta del producto.
- Evite el contacto directo con los ojos. Si el producto entra en contacto con ellos, enjuague abundantemente con agua y busque asistencia si la irritación persiste.
- No ingerir. Manténgase fuera del alcance de los niños.
- Aplíquese sobre la piel o la ropa según las indicaciones. Algunas fragancias pueden manchar tejidos delicados.

## Sensibilidad

Las fragancias pueden contener ingredientes que causen sensibilidad o una reacción alérgica en algunas personas, incluso usando el producto según las indicaciones.

- Si tiene la piel sensible o una alergia conocida a las fragancias, revise la lista de ingredientes en la ficha del producto y en el envase antes de usarlo.
- Considere probar una pequeña cantidad en una zona discreta de la piel.
- **Suspenda su uso si aparece irritación, enrojecimiento o molestia.** Consulte a un médico si la reacción persiste o es grave.

## Inflamabilidad

Muchas fragancias contienen alcohol y son inflamables.

- Manténgase alejado del calor, chispas, llamas abiertas y otras fuentes de ignición.
- No pulverice cerca de una llama ni sobre una superficie encendida.
- No perfore ni queme el envase, ni siquiera vacío.

## Conservación

Conserve el producto en su envase original, en posición vertical, alejado de la luz solar directa y del calor o los cambios bruscos de temperatura. La fragancia evoluciona con el tiempo, y el calor y la luz aceleran ese cambio.

## Ingredientes

Cuando en una ficha de producto se muestra una lista de ingredientes, esta reproduce la declaración facilitada para ese producto. Si necesita la declaración completa y actual de un lote concreto, consulte el envase recibido o contáctenos.

## Sin declaraciones sanitarias

Nuestros productos son fragancias. Nada en este sitio constituye una afirmación de que un producto trate, prevenga, cure o alivie ninguna afección médica, psicológica o dermatológica, y nada aquí constituye consejo médico. Si tiene una preocupación de salud, consulte a un profesional sanitario cualificado.

## Embarazo, menores y afecciones médicas

Si está embarazada o en periodo de lactancia, o si padece una afección cutánea o respiratoria, consulte a un profesional sanitario cualificado antes de usar una fragancia nueva.

## Contacto

{{#if supportEmail}}Si tiene una consulta de seguridad sobre un producto recibido, escríbanos a {{supportEmail}}.{{/if}}
Si sufre una reacción grave, busque atención médica primero y comuníquenoslo después para que podamos investigarlo.`,
  },

  cookies: {
    title: 'Aviso sobre cookies y seguimiento',
    seoDescription: 'Qué guarda Mian Dubai en su navegador y por qué. No se utilizan rastreadores publicitarios ni de analítica.',
    content: `Este aviso describe qué almacena este sitio en su dispositivo y por qué. Refleja lo que el sitio hace realmente: no enumeramos cookies que no instalamos.

## Lo que utilizamos actualmente

**Preferencias guardadas en su navegador (almacenamiento local)**

- **Preferencia de idioma** — para que el sitio se abra en el idioma elegido.
- **Preferencia de moneda** — para mostrar los precios en la moneda elegida.
- **Contenido de la bolsa** — para que su bolsa sobreviva a una recarga de página.

Estos datos los guarda su navegador en su propio dispositivo. No se nos envían como cookies y no podemos leerlos desde nuestros servidores.

**Cookies de sesión de administración**

Cuando un miembro del equipo de Mian Dubai inicia sesión en el área de administración, instalamos una cookie de sesión y otra de protección CSRF. Son estrictamente necesarias para el funcionamiento seguro de esa área y no se instalan a los visitantes de la tienda.

**Registros de seguridad**

Nuestros servidores conservan registros breves de las peticiones, como se describe en nuestra Política de privacidad. No son cookies, pero los mencionamos para dar una imagen completa.

## Lo que no utilizamos

A fecha de redacción, este sitio **no** utiliza:

- rastreadores publicitarios o de retargeting;
- analítica de terceros como Google Analytics;
- píxeles de redes sociales como los de Meta o TikTok;
- seguimiento entre sitios de ningún tipo.

Por eso no le mostramos un banner de consentimiento: actualmente no hay nada no esencial que consentir. Preferimos no interrumpirle con un banner que no hace nada.

## Si esto cambia

Si más adelante añadimos tecnología de analítica o marketing, actualizaremos este aviso e implantaremos un mecanismo de consentimiento adecuado **antes** de utilizar cualquier seguimiento no esencial.

## Gestionar el almacenamiento en su navegador

Puede borrar los datos del sitio o bloquear el almacenamiento desde la configuración de su navegador. Si lo hace, se olvidarán sus preferencias de idioma, moneda y bolsa, y el sitio volverá a sus valores predeterminados.

## Contacto

{{#if supportEmail}}Consultas sobre este aviso: {{supportEmail}}{{/if}}
O utilice el formulario de nuestra página de Contacto.`,
  },

  accessibility: {
    title: 'Declaración de accesibilidad',
    seoDescription: 'El compromiso de Mian Dubai con un sitio accesible y cómo informarnos de una barrera.',
    content: `{{brandName}} quiere que todo el mundo pueda descubrir nuestras fragancias y ponerse en contacto con nosotros. Esta declaración explica en qué punto estamos y cómo informarnos cuando nos quedamos cortos.

## Nuestro objetivo

Aspiramos a cumplir las **Pautas de Accesibilidad para el Contenido Web (WCAG) 2.2 en el nivel AA**. Lo consideramos un compromiso continuo, no un ejercicio puntual.

## Lo que hemos incorporado

- Estructura HTML semántica con un orden lógico de encabezados y regiones de página.
- Un enlace «saltar al contenido» y manejo completo por teclado, incluidos menús, filtros, la búsqueda y la bolsa.
- Indicadores de foco visibles en todos los elementos interactivos.
- Etiquetas asociadas a cada campo de formulario y mensajes de error anunciados, no transmitidos solo mediante color.
- Texto alternativo para las imágenes de producto, editable por nuestro equipo imagen a imagen.
- Combinaciones de color elegidas para cumplir las relaciones de contraste AA en el texto.
- Compatibilidad con la preferencia «reducir movimiento» de su sistema: la animación decorativa se suprime si ha solicitado menos movimiento.
- Diseños que se reorganizan en una sola columna en pantallas pequeñas sin desplazamiento horizontal y que toleran un aumento del tamaño del texto.

## Limitaciones conocidas

- Cuando una imagen de producto se ha subido sin texto alternativo, generamos una descripción de reserva a partir del nombre del producto. Es precisa, pero menos específica que un texto redactado por una persona.
- Los servicios de terceros a los que se accede desde nuestro sitio —por ejemplo, una mensajería usada para completar un pedido— quedan fuera de nuestro control y tienen sus propias características de accesibilidad.

## Infórmenos de una barrera

Si algo en este sitio le impide hacer aquello a lo que venía, díganoslo. Describa la página y lo ocurrido, y trabajaremos con usted para facilitarle la información o el producto que buscaba.

{{#if supportEmail}}Correo electrónico: {{supportEmail}}{{/if}}
{{#if phone}}Teléfono: {{phone}}{{/if}}

Nos tomamos estos avisos en serio y responderemos con la mayor rapidez razonablemente posible.

## Otras formas de contactarnos

Si no puede completar algo en el sitio web, contáctenos directamente y un miembro de nuestro equipo le atenderá personalmente con su consulta o su pedido.`,
  },
};
