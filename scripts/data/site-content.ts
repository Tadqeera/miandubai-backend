/**
 * Starter storefront copy in English, French and Spanish.
 *
 * Every line here is editable from Admin → Homepage. Nothing claims a founding
 * year, an award, a certification or a manufacturing origin, because none of
 * those have been supplied.
 */
export interface ContentSeedTranslation {
  locale: 'en' | 'fr' | 'es';
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaLabelAlt?: string;
  ctaHrefAlt?: string;
  items?: Array<Record<string, string>>;
}

export interface ContentSeed {
  key: string;
  translations: ContentSeedTranslation[];
}

export const CONTENT_SEED: ContentSeed[] = [
  {
    key: 'announcement',
    translations: [
      { locale: 'en', heading: 'California delivery', body: 'Estimated 2 to 5 business days' },
      { locale: 'fr', heading: 'Livraison en Californie', body: 'Estimation de 2 à 5 jours ouvrés' },
      { locale: 'es', heading: 'Entrega en California', body: 'Estimación de 2 a 5 días hábiles' },
    ],
  },
  {
    key: 'home.hero',
    translations: [
      {
        locale: 'en',
        heading: 'A Signature Beyond Scent',
        subheading: 'Composed with depth. Worn with presence.',
        ctaLabel: 'Discover the collection',
        ctaHref: '/collection',
        ctaLabelAlt: 'Contact us',
        ctaHrefAlt: '/contact',
      },
      {
        locale: 'fr',
        heading: 'Une signature au-delà du parfum',
        subheading: 'Composé avec profondeur. Porté avec présence.',
        ctaLabel: 'Découvrir la collection',
        ctaHref: '/collection',
        ctaLabelAlt: 'Nous contacter',
        ctaHrefAlt: '/contact',
      },
      {
        locale: 'es',
        heading: 'Una firma más allá del aroma',
        subheading: 'Compuesto con profundidad. Llevado con presencia.',
        ctaLabel: 'Descubrir la colección',
        ctaHref: '/collection',
        ctaLabelAlt: 'Contáctenos',
        ctaHrefAlt: '/contact',
      },
    ],
  },
  {
    key: 'home.featured',
    translations: [
      { locale: 'en', eyebrow: 'Signature fragrances', heading: 'The Collection', subheading: 'The compositions we would hand you first.' },
      { locale: 'fr', eyebrow: 'Parfums signature', heading: 'La collection', subheading: 'Les compositions que nous vous tendrions en premier.' },
      { locale: 'es', eyebrow: 'Fragancias insignia', heading: 'La colección', subheading: 'Las composiciones que le ofreceríamos primero.' },
    ],
  },
  {
    key: 'home.story',
    translations: [
      {
        locale: 'en',
        eyebrow: 'The House',
        heading: 'The House of Mian Dubai',
        body:
          'Mian Dubai is a fragrance house built on restraint. We are interested in the moment a scent stops being a product and becomes a way of entering a room.\n\nEach composition is assembled deliberately, chosen for how it develops on skin over hours, not for how loudly it opens. Nothing leaves us until it holds together from the first minute to the last.\n\nWe keep our range deliberately small. A house is judged by what it declines to release.',
        ctaLabel: 'Read our story',
        ctaHref: '/about',
      },
      {
        locale: 'fr',
        eyebrow: 'La maison',
        heading: 'La maison Mian Dubai',
        body:
          'Mian Dubai est une maison de parfum fondée sur la retenue. Nous nous intéressons à l’instant où un parfum cesse d’être un produit pour devenir une manière d’entrer dans une pièce.\n\nChaque composition est assemblée avec intention, choisie pour la façon dont elle évolue sur la peau au fil des heures, non pour la force de son ouverture. Rien ne nous quitte avant de tenir de la première minute à la dernière.\n\nNous gardons notre gamme volontairement restreinte. Une maison se juge à ce qu’elle renonce à publier.',
        ctaLabel: 'Lire notre histoire',
        ctaHref: '/about',
      },
      {
        locale: 'es',
        eyebrow: 'La casa',
        heading: 'La casa de Mian Dubai',
        body:
          'Mian Dubai es una casa de perfumes construida sobre la contención. Nos interesa el momento en que un aroma deja de ser un producto y se convierte en una forma de entrar en una sala.\n\nCada composición se ensambla de forma deliberada, elegida por cómo evoluciona sobre la piel a lo largo de las horas y no por lo alto que suene su salida. Nada sale de aquí hasta que se sostiene desde el primer minuto hasta el último.\n\nMantenemos nuestra gama deliberadamente pequeña. A una casa se la juzga por lo que decide no publicar.',
        ctaLabel: 'Leer nuestra historia',
        ctaHref: '/about',
      },
    ],
  },
  {
    key: 'home.bestsellers',
    translations: [
      { locale: 'en', eyebrow: 'Most requested', heading: 'Best Sellers' },
      { locale: 'fr', eyebrow: 'Les plus demandés', heading: 'Meilleures ventes' },
      { locale: 'es', eyebrow: 'Los más solicitados', heading: 'Más vendidos' },
    ],
  },
  {
    key: 'home.newArrivals',
    translations: [
      { locale: 'en', eyebrow: 'Latest', heading: 'New Arrivals' },
      { locale: 'fr', eyebrow: 'Nouveautés', heading: 'Dernières arrivées' },
      { locale: 'es', eyebrow: 'Novedades', heading: 'Recién llegados' },
    ],
  },
  {
    key: 'home.collections',
    translations: [
      { locale: 'en', eyebrow: 'Explore', heading: 'Discover by Collection', subheading: 'Families grouped by the character they share.' },
      { locale: 'fr', eyebrow: 'Explorer', heading: 'Découvrir par collection', subheading: 'Des familles réunies par le caractère qu’elles partagent.' },
      { locale: 'es', eyebrow: 'Explorar', heading: 'Descubrir por colección', subheading: 'Familias agrupadas por el carácter que comparten.' },
    ],
  },
  {
    key: 'home.scentArchitecture',
    translations: [
      {
        locale: 'en',
        eyebrow: 'How a fragrance unfolds',
        heading: 'Scent Architecture',
        subheading: 'A fragrance is not one impression. It is three, arriving in sequence.',
        items: [
          {
            title: 'Top notes',
            text: 'The first impression: bright, immediate and fleeting. An introduction, never the conclusion.',
          },
          {
            title: 'Heart notes',
            text: 'The character of the fragrance, revealed as the opening settles and carried through the middle hours.',
          },
          {
            title: 'Base notes',
            text: 'The lasting foundation. The heaviest materials, remaining closest to memory long after the rest has gone.',
          },
        ],
      },
      {
        locale: 'fr',
        eyebrow: 'Comment un parfum se révèle',
        heading: 'Architecture olfactive',
        subheading: 'Un parfum n’est pas une impression unique. Il en compte trois, qui se succèdent.',
        items: [
          {
            title: 'Notes de tête',
            text: 'La première impression : vive, immédiate et éphémère. Une introduction, jamais une conclusion.',
          },
          {
            title: 'Notes de cœur',
            text: 'Le caractère du parfum, révélé lorsque l’ouverture s’apaise et porté durant les heures médianes.',
          },
          {
            title: 'Notes de fond',
            text: 'La fondation durable. Les matières les plus lourdes, celles qui restent au plus près du souvenir.',
          },
        ],
      },
      {
        locale: 'es',
        eyebrow: 'Cómo se revela una fragancia',
        heading: 'Arquitectura olfativa',
        subheading: 'Una fragancia no es una sola impresión. Son tres, que llegan en secuencia.',
        items: [
          {
            title: 'Notas de salida',
            text: 'La primera impresión: luminosa, inmediata y efímera. Una introducción, nunca la conclusión.',
          },
          {
            title: 'Notas de corazón',
            text: 'El carácter de la fragancia, revelado cuando la salida se asienta y sostenido en las horas intermedias.',
          },
          {
            title: 'Notas de fondo',
            text: 'El cimiento duradero. Los materiales más pesados, los que permanecen más cerca del recuerdo.',
          },
        ],
      },
    ],
  },
  {
    key: 'home.concierge',
    translations: [
      {
        locale: 'en',
        eyebrow: 'Personal assistance',
        heading: 'Need help choosing your scent?',
        body: 'Tell us what you wear now, what you want to be remembered for, and where you will be wearing it. We will point you to the right composition, and say so plainly if none of ours is right for you.',
        ctaLabel: 'Speak with Mian Dubai',
      },
      {
        locale: 'fr',
        eyebrow: 'Assistance personnelle',
        heading: 'Besoin d’aide pour choisir votre parfum ?',
        body: 'Dites-nous ce que vous portez aujourd’hui, ce dont vous souhaitez qu’on se souvienne, et dans quel cadre vous le porterez. Nous vous orienterons vers la bonne composition, et vous le dirons franchement si aucune des nôtres ne vous convient.',
        ctaLabel: 'Parler à Mian Dubai',
      },
      {
        locale: 'es',
        eyebrow: 'Asistencia personal',
        heading: '¿Necesita ayuda para elegir su aroma?',
        body: 'Cuéntenos qué lleva ahora, por qué quiere ser recordado y dónde lo va a llevar. Le orientaremos hacia la composición adecuada, y se lo diremos con claridad si ninguna de las nuestras es la indicada.',
        ctaLabel: 'Hablar con Mian Dubai',
      },
    ],
  },
  {
    key: 'home.promises',
    translations: [
      {
        locale: 'en',
        eyebrow: 'What to expect',
        heading: 'The Mian Dubai Promise',
        items: [
          { title: 'Presented as received', text: 'Sealed bottles, exactly as supplied to us.' },
          { title: 'Packed with care', text: 'Protected for transit, not padded for show.' },
          { title: 'California delivery', text: 'Estimated 2 to 5 business days, updated if that changes.' },
          { title: 'Personal guidance', text: 'Speak directly with Mian Dubai for fragrance assistance.' },
        ],
      },
      {
        locale: 'fr',
        eyebrow: 'Ce que vous pouvez attendre',
        heading: 'L’engagement Mian Dubai',
        items: [
          { title: 'Présenté tel que reçu', text: 'Flacons scellés, exactement tels qu’ils nous sont fournis.' },
          { title: 'Emballé avec soin', text: 'Protégé pour le transport, non rembourré pour l’apparence.' },
          { title: 'Livraison en Californie', text: 'Estimation de 2 à 5 jours ouvrés, mise à jour si cela change.' },
          { title: 'Conseil personnel', text: 'Échangez directement avec Mian Dubai pour être guidé.' },
        ],
      },
      {
        locale: 'es',
        eyebrow: 'Qué puede esperar',
        heading: 'El compromiso de Mian Dubai',
        items: [
          { title: 'Presentado tal como se recibe', text: 'Frascos precintados, exactamente como se nos suministran.' },
          { title: 'Empaquetado con cuidado', text: 'Protegido para el transporte, no acolchado para aparentar.' },
          { title: 'Entrega en California', text: 'Estimación de 2 a 5 días hábiles, actualizada si eso cambia.' },
          { title: 'Orientación personal', text: 'Hable directamente con Mian Dubai para recibir orientación.' },
        ],
      },
    ],
  },
  {
    key: 'home.newsletter',
    translations: [
      {
        locale: 'en',
        eyebrow: 'Correspondence',
        heading: 'Private Notes from Mian Dubai',
        body: 'Occasional letters on new compositions and how to wear them. No schedule, no noise. Leave whenever you wish.',
      },
      {
        locale: 'fr',
        eyebrow: 'Correspondance',
        heading: 'Notes privées de Mian Dubai',
        body: 'Des lettres occasionnelles sur les nouvelles compositions et la manière de les porter. Sans calendrier, sans bruit. Vous partez quand vous le souhaitez.',
      },
      {
        locale: 'es',
        eyebrow: 'Correspondencia',
        heading: 'Notas privadas de Mian Dubai',
        body: 'Cartas ocasionales sobre nuevas composiciones y cómo llevarlas. Sin calendario ni ruido. Puede darse de baja cuando quiera.',
      },
    ],
  },
  {
    key: 'about.intro',
    translations: [
      {
        locale: 'en',
        eyebrow: 'Our story',
        heading: 'Built on restraint',
        subheading: 'A fragrance house is defined less by what it releases than by what it holds back.',
        body:
          'Mian Dubai began with a simple dissatisfaction: most fragrances announce themselves loudly and then disappear. We wanted the opposite: compositions that arrive quietly and stay.\n\nThat principle governs everything. We would rather offer a short range we can stand behind entirely than a long one padded out to look substantial.',
      },
      {
        locale: 'fr',
        eyebrow: 'Notre histoire',
        heading: 'Fondée sur la retenue',
        subheading: 'Une maison de parfum se définit moins par ce qu’elle publie que par ce qu’elle retient.',
        body:
          'Mian Dubai est née d’une insatisfaction simple : la plupart des parfums s’annoncent bruyamment puis disparaissent. Nous voulions l’inverse : des compositions qui arrivent discrètement et demeurent.\n\nCe principe gouverne tout. Nous préférons une gamme courte que nous assumons entièrement à une gamme longue étoffée pour paraître consistante.',
      },
      {
        locale: 'es',
        eyebrow: 'Nuestra historia',
        heading: 'Construida sobre la contención',
        subheading: 'Una casa de perfumes se define menos por lo que publica que por lo que retiene.',
        body:
          'Mian Dubai nació de una insatisfacción sencilla: la mayoría de las fragancias se anuncian con estruendo y luego desaparecen. Queríamos lo contrario: composiciones que llegan en voz baja y permanecen.\n\nEse principio lo rige todo. Preferimos una gama corta que podamos respaldar por completo antes que una larga rellenada para parecer sustancial.',
      },
    ],
  },
  {
    key: 'about.craft',
    translations: [
      {
        locale: 'en',
        heading: 'How we compose',
        body:
          'A composition is judged over hours, not seconds. We assess each one on skin through a full wear: the opening, the turn into the heart, and what remains at the end of a day.\n\nWe publish the note structure of every fragrance so you can read it before you commit. Where something is not listed, it is because we do not yet have it to give you, not because we are withholding it.',
      },
      {
        locale: 'fr',
        heading: 'Notre manière de composer',
        body:
          'Une composition se juge sur des heures, non sur des secondes. Nous évaluons chacune d’elles sur la peau, du début à la fin : l’ouverture, le passage au cœur, et ce qui subsiste en fin de journée.\n\nNous publions la structure des notes de chaque parfum afin que vous puissiez la lire avant de vous engager. Si un élément n’apparaît pas, c’est que nous ne l’avons pas encore, non que nous le dissimulions.',
      },
      {
        locale: 'es',
        heading: 'Cómo componemos',
        body:
          'Una composición se juzga a lo largo de horas, no de segundos. Evaluamos cada una sobre la piel durante un uso completo: la salida, el paso al corazón y lo que queda al final del día.\n\nPublicamos la estructura de notas de cada fragancia para que pueda leerla antes de decidirse. Si algo no figura, es porque todavía no lo tenemos, no porque lo estemos ocultando.',
      },
    ],
  },
  {
    key: 'contact.intro',
    translations: [
      {
        locale: 'en',
        eyebrow: 'Contact',
        heading: 'Speak with Mian Dubai',
        subheading: 'Questions about a fragrance, an order or a delivery reach a person, not a queue.',
      },
      {
        locale: 'fr',
        eyebrow: 'Contact',
        heading: 'Parler à Mian Dubai',
        subheading: 'Vos questions sur un parfum, une commande ou une livraison arrivent à une personne, non à une file d’attente.',
      },
      {
        locale: 'es',
        eyebrow: 'Contacto',
        heading: 'Hable con Mian Dubai',
        subheading: 'Sus preguntas sobre una fragancia, un pedido o una entrega llegan a una persona, no a una cola.',
      },
    ],
  },
  {
    key: 'faq',
    translations: [
      {
        locale: 'en',
        eyebrow: 'Help',
        heading: 'Frequently Asked Questions',
        items: [
          {
            question: 'Where does Mian Dubai currently deliver?',
            answer: 'We currently deliver within California, United States. If you are outside that area, contact us and we will tell you honestly whether we can help.',
          },
          {
            question: 'How long does delivery take?',
            answer: 'Our current estimate is 2 to 5 business days from the moment your order is confirmed. It is an estimate rather than a guaranteed date, and some products show their own estimate on their product page.',
          },
          {
            question: 'How can I place an order?',
            answer: 'Browse the collection, add what you want to your bag, then send your bag to us through WhatsApp. We confirm availability, the final price, the delivery details and how payment will be arranged before anything is finalised.',
          },
          {
            question: 'Can I order through WhatsApp?',
            answer: 'Yes, that is currently how every order is completed. There is no online payment form on this site. Your bag becomes a clear, itemised message that you send to us, and we reply personally.',
          },
          {
            question: 'How should perfume be stored?',
            answer: 'Upright, in its original packaging, away from direct sunlight and away from heat or large temperature swings. Fragrance changes over time, and heat and light accelerate that change. A drawer or a closed cupboard is better than a bathroom shelf.',
          },
          {
            question: 'Can fragrance cause sensitivity?',
            answer: 'It can. Fragrance products may contain ingredients that cause sensitivity or an allergic reaction in some individuals. Review the ingredient declaration, consider testing a small amount on a discreet area first, and discontinue use if irritation occurs. See our Product Safety page for the full guidance.',
          },
          {
            question: 'Can I return an opened fragrance?',
            answer: 'Generally no. Once a bottle has been opened or used we cannot accept it back for resale, for hygiene reasons. That restriction does not apply if the item is the wrong product, arrived damaged or is defective, and it does not affect rights you have under applicable law that cannot be waived. Our Returns policy has the detail.',
          },
          {
            question: 'How can I contact Mian Dubai?',
            answer: 'Through WhatsApp, by email, or using the form on our Contact page. Whichever you choose, a person reads it.',
          },
        ],
      },
      {
        locale: 'fr',
        eyebrow: 'Aide',
        heading: 'Questions fréquentes',
        items: [
          {
            question: 'Où Mian Dubai livre-t-il actuellement ?',
            answer: 'Nous livrons actuellement en Californie, aux États-Unis. Si vous êtes en dehors de cette zone, contactez-nous : nous vous dirons honnêtement si nous pouvons vous aider.',
          },
          {
            question: 'Quel est le délai de livraison ?',
            answer: 'Notre estimation actuelle est de 2 à 5 jours ouvrés à compter de la confirmation de votre commande. Il s’agit d’une estimation et non d’une date garantie ; certains produits affichent leur propre estimation sur leur fiche.',
          },
          {
            question: 'Comment passer commande ?',
            answer: 'Parcourez la collection, ajoutez ce que vous souhaitez à votre panier, puis envoyez-nous ce panier via WhatsApp. Nous confirmons la disponibilité, le prix final, les modalités de livraison et de paiement avant toute finalisation.',
          },
          {
            question: 'Puis-je commander via WhatsApp ?',
            answer: 'Oui, c’est actuellement ainsi que toute commande se conclut. Ce site ne comporte aucun formulaire de paiement en ligne. Votre panier devient un message détaillé et clair que vous nous envoyez, et nous vous répondons personnellement.',
          },
          {
            question: 'Comment conserver un parfum ?',
            answer: 'À la verticale, dans son emballage d’origine, à l’abri de la lumière directe du soleil et de la chaleur ou des écarts de température. Le parfum évolue avec le temps, et la chaleur et la lumière accélèrent cette évolution. Un tiroir ou un placard fermé vaut mieux qu’une étagère de salle de bain.',
          },
          {
            question: 'Un parfum peut-il provoquer une sensibilité ?',
            answer: 'Oui, cela peut arriver. Les parfums peuvent contenir des ingrédients provoquant une sensibilité ou une réaction allergique chez certaines personnes. Consultez la liste d’ingrédients, envisagez de tester une petite quantité sur une zone discrète, et cessez l’utilisation en cas d’irritation. Voir notre page Sécurité des produits.',
          },
          {
            question: 'Puis-je retourner un parfum ouvert ?',
            answer: 'En principe non : une fois un flacon ouvert ou utilisé, nous ne pouvons pas le reprendre en vue d’une revente, pour des raisons d’hygiène. Cette restriction ne s’applique pas si l’article est erroné, endommagé ou défectueux, et n’affecte pas les droits que la loi applicable ne permet pas d’écarter. Voir notre politique de retour.',
          },
          {
            question: 'Comment contacter Mian Dubai ?',
            answer: 'Via WhatsApp, par e-mail, ou au moyen du formulaire de notre page Contact. Quel que soit le canal, une personne vous lit.',
          },
        ],
      },
      {
        locale: 'es',
        eyebrow: 'Ayuda',
        heading: 'Preguntas frecuentes',
        items: [
          {
            question: '¿Dónde entrega actualmente Mian Dubai?',
            answer: 'Actualmente entregamos en California, Estados Unidos. Si se encuentra fuera de esa zona, contáctenos y le diremos con honestidad si podemos ayudarle.',
          },
          {
            question: '¿Cuánto tarda la entrega?',
            answer: 'Nuestra estimación actual es de 2 a 5 días hábiles desde la confirmación de su pedido. Es una estimación, no una fecha garantizada, y algunos productos muestran su propia estimación en su ficha.',
          },
          {
            question: '¿Cómo puedo realizar un pedido?',
            answer: 'Recorra la colección, añada lo que desee a su bolsa y envíenosla por WhatsApp. Confirmamos la disponibilidad, el precio final, los detalles de entrega y la forma de pago antes de cerrar nada.',
          },
          {
            question: '¿Puedo pedir por WhatsApp?',
            answer: 'Sí: actualmente así se completa cada pedido. En este sitio no hay ningún formulario de pago en línea. Su bolsa se convierte en un mensaje detallado y claro que nos envía, y le respondemos personalmente.',
          },
          {
            question: '¿Cómo se debe conservar un perfume?',
            answer: 'En vertical, en su envase original, lejos de la luz solar directa y del calor o de los cambios bruscos de temperatura. La fragancia evoluciona con el tiempo, y el calor y la luz aceleran ese cambio. Un cajón o un armario cerrado es mejor que un estante del baño.',
          },
          {
            question: '¿Puede una fragancia causar sensibilidad?',
            answer: 'Puede. Las fragancias pueden contener ingredientes que causen sensibilidad o una reacción alérgica en algunas personas. Revise la declaración de ingredientes, considere probar una pequeña cantidad en una zona discreta y suspenda su uso si aparece irritación. Consulte nuestra página de Seguridad del producto.',
          },
          {
            question: '¿Puedo devolver una fragancia abierta?',
            answer: 'En general no: una vez abierto o usado un frasco no podemos aceptarlo de vuelta para su reventa, por razones de higiene. Esa restricción no se aplica si el artículo es incorrecto, llegó dañado o es defectuoso, y no afecta a los derechos que la legislación aplicable no permita renunciar. Consulte nuestra política de devoluciones.',
          },
          {
            question: '¿Cómo puedo contactar con Mian Dubai?',
            answer: 'Por WhatsApp, por correo electrónico o mediante el formulario de nuestra página de Contacto. Elija el que elija, lo lee una persona.',
          },
        ],
      },
    ],
  },
  {
    key: 'legal.intro',
    translations: [
      {
        locale: 'en',
        eyebrow: 'Customer information',
        heading: 'Legal & Customer Information',
        subheading:
          'Policies and information relating to your use of Mian Dubai, orders, delivery, privacy and fragrance safety.',
      },
      {
        locale: 'fr',
        eyebrow: 'Informations clients',
        heading: 'Mentions légales et informations clients',
        subheading:
          'Les politiques et informations relatives à votre utilisation de Mian Dubai, aux commandes, à la livraison, à la confidentialité et à la sécurité des parfums.',
      },
      {
        locale: 'es',
        eyebrow: 'Información para clientes',
        heading: 'Información legal y para clientes',
        subheading:
          'Políticas e información relativas a su uso de Mian Dubai, los pedidos, la entrega, la privacidad y la seguridad de las fragancias.',
      },
    ],
  },
  {
    key: 'footer.brand',
    translations: [
      {
        locale: 'en',
        body: 'A fragrance house shaped by depth, presence and considered composition.',
      },
      {
        locale: 'fr',
        body: 'Une maison de parfum façonnée par la profondeur, la présence et la composition réfléchie.',
      },
      {
        locale: 'es',
        body: 'Una casa de perfumes formada por la profundidad, la presencia y la composición meditada.',
      },
    ],
  },
];

/**
 * Structural starter taxonomy. These are empty containers the administrator can
 * rename or delete — no products are seeded anywhere.
 */
export const CATEGORY_SEED = [
  { slug: 'men', sortOrder: 10, names: { en: 'Men', fr: 'Homme', es: 'Hombre' } },
  { slug: 'women', sortOrder: 20, names: { en: 'Women', fr: 'Femme', es: 'Mujer' } },
  { slug: 'unisex', sortOrder: 30, names: { en: 'Unisex', fr: 'Mixte', es: 'Unisex' } },
  { slug: 'extrait', sortOrder: 40, names: { en: 'Extrait', fr: 'Extrait', es: 'Extracto' } },
  { slug: 'eau-de-parfum', sortOrder: 50, names: { en: 'Eau de Parfum', fr: 'Eau de parfum', es: 'Eau de Parfum' } },
];

export const COLLECTION_SEED = [
  {
    slug: 'signature-collection',
    sortOrder: 10,
    names: { en: 'Signature Collection', fr: 'Collection signature', es: 'Colección insignia' },
    taglines: {
      en: 'The compositions that define the house.',
      fr: 'Les compositions qui définissent la maison.',
      es: 'Las composiciones que definen la casa.',
    },
  },
  {
    slug: 'new-arrivals',
    sortOrder: 20,
    names: { en: 'New Arrivals', fr: 'Nouveautés', es: 'Novedades' },
    taglines: { en: 'Most recently released.', fr: 'Les plus récemment publiées.', es: 'Lo más reciente.' },
  },
  {
    slug: 'best-sellers',
    sortOrder: 30,
    names: { en: 'Best Sellers', fr: 'Meilleures ventes', es: 'Más vendidos' },
    taglines: { en: 'Most requested by our clients.', fr: 'Les plus demandées par nos clients.', es: 'Las más solicitadas por nuestros clientes.' },
  },
];
