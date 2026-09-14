/** French starter text for the seven policy pages. Mirrors legal-en.ts. */
export const LEGAL_FR: Record<string, { title: string; content: string; seoDescription: string }> = {
  terms: {
    title: 'Conditions d’utilisation et de vente',
    seoDescription: 'Les conditions applicables à l’utilisation du site Mian Dubai et à toute commande passée auprès de nous.',
    content: `Ces conditions s’appliquent à votre utilisation de ce site et à toute commande passée auprès de {{brandName}}{{#if legalEntityName}} ({{legalEntityName}}){{/if}} (« Mian Dubai », « nous »). Veuillez les lire avant d’utiliser le site ou de passer commande.

## 1. Utilisation du site

Vous pouvez consulter et utiliser ce site à des fins personnelles et non commerciales. Vous vous engagez à ne pas en faire un usage abusif — notamment en tentant d’y accéder sans autorisation, en perturbant son fonctionnement, en l’extrayant à une échelle qui dégrade le service pour les autres, ou en l’utilisant à des fins illicites.

Le contenu de ce site, y compris les textes, la mise en page, les photographies, les graphismes ainsi que le nom et le logo Mian Dubai, nous appartient ou appartient à nos concédants. Vous ne pouvez pas le copier ni le réutiliser à des fins commerciales sans notre autorisation écrite.

## 2. Comment les commandes sont passées

Nous n’acceptons pas actuellement de paiement en ligne. Les commandes sont organisées directement avec nous, et le site vous orientera vers un canal de messagerie ou de contact pour finaliser votre demande.

Ajouter des articles à votre panier, ou nous envoyer une liste d’articles, constitue une **demande** — et non un achat conclu. Une commande n’existe qu’une fois que nous vous avons confirmé :

- la disponibilité des articles ;
- le prix final, y compris les frais de livraison éventuels et les taxes applicables ;
- l’adresse de livraison et le délai estimé ;
- les modalités de paiement.

Nous pouvons refuser ou annuler une demande avant sa confirmation — par exemple si un article est épuisé, en cas d’erreur de prix ou de description, ou si nous ne pouvons pas livrer à l’adresse indiquée.

## 3. Prix et informations produits

Les prix affichés le sont dans la devise que vous avez sélectionnée. Lorsqu’un montant en AED accompagne un prix en USD, il peut être converti selon un taux de référence interne et n’est donné qu’à titre indicatif ; le montant confirmé avec vous au moment de la commande est celui qui s’applique.

Nous décrivons nos parfums avec soin. Les couleurs, l’emballage et la présentation peuvent légèrement différer des images en raison de la photographie, de l’éclairage et de votre écran. Les contenances et les concentrations sont indiquées sur chaque fiche produit.

## 4. Disponibilité et livraison

Nous livrons actuellement dans la zone suivante : {{shippingRegion}}. Les délais sont exprimés en jours ouvrés et constituent des estimations, non des garanties. Voir notre Politique d’expédition et de livraison.

## 5. Retours

Vos droits et la procédure sont détaillés dans notre Politique de retour et de remboursement. Rien dans les présentes conditions ne limite un droit que la loi applicable ne permet pas de limiter.

## 6. Sécurité des produits

Les parfums sont destinés à un usage externe uniquement et peuvent contenir des ingrédients provoquant une sensibilité chez certaines personnes. Veuillez lire notre Avertissement de sécurité produit ainsi que les informations figurant sur l’emballage du produit, qui priment toujours sur le contenu de ce site.

## 7. Vos données

Nous traitons les données personnelles comme décrit dans notre Politique de confidentialité.

## 8. Disponibilité du site

Nous nous efforçons de maintenir le site accessible, mais nous pouvons suspendre, retirer ou modifier toute partie de celui-ci — y compris des produits individuels — sans préavis. Nous ne garantissons pas que le site sera toujours disponible ni exempt d’erreurs.

## 9. Notre responsabilité

Dans toute la mesure permise par la loi applicable, nous ne sommes pas responsables des pertes indirectes ou consécutives, des pertes de bénéfices, ni des pertes résultant de votre utilisation ou de votre impossibilité d’utiliser ce site.

Rien dans ces conditions n’exclut ni ne limite notre responsabilité lorsque la loi l’interdit. Cela inclut la responsabilité en cas de décès ou de dommage corporel résultant d’une négligence, en cas de fraude ou de déclaration frauduleuse, ainsi que tout droit légal relatif aux produits vendus qui ne peut être légalement exclu.

## 10. Modification des conditions

Nous pouvons mettre à jour ces conditions. La version publiée sur cette page au moment où vous passez commande est celle qui s’applique à cette commande. La date d’entrée en vigueur figure en haut de cette page.

## 11. Droit applicable

Ces conditions sont régies par le droit de l’État de {{governingLawState}}, États-Unis, sans égard à ses règles de conflit de lois.{{#if governingLawVenue}} Les tribunaux situés à {{governingLawVenue}} seront compétents pour tout litige qui en découlerait.{{/if}} Cela ne vous prive pas de la protection des règles impératives de protection des consommateurs applicables à votre lieu de résidence.

## 12. Nous contacter

{{#if supportEmail}}E-mail : {{supportEmail}}{{/if}}
{{#if phone}}Téléphone : {{phone}}{{/if}}
{{#if businessAddress}}Adresse : {{businessAddress}}{{/if}}

Si aucune coordonnée n’apparaît ci-dessus, veuillez utiliser le formulaire de notre page Contact.`,
  },

  privacy: {
    title: 'Politique de confidentialité',
    seoDescription: 'Comment Mian Dubai collecte, utilise et protège les données personnelles, y compris les informations destinées aux résidents de Californie.',
    content: `Cette politique explique quelles données personnelles {{brandName}} collecte via ce site, pourquoi, et quels choix vous avez. Elle est rédigée en tenant compte du California Online Privacy Protection Act (CalOPPA), puisque nous servons actuellement des clients dans la zone suivante : {{shippingRegion}}.

## 1. Catégories de données personnelles collectées

**Données que vous nous fournissez directement**

- **Formulaire de contact :** votre nom, votre adresse e-mail, un numéro de téléphone facultatif, le sujet sélectionné et le contenu de votre message.
- **Newsletter :** votre adresse e-mail et la langue de navigation, si vous choisissez de vous inscrire.
- **Demandes de commande :** lorsque vous poursuivez une commande via une messagerie, les informations que vous y transmettez — généralement votre nom, votre adresse de livraison et le détail de la commande.

**Données collectées automatiquement**

- **Données techniques et de sécurité :** votre adresse IP, le type et la version de votre navigateur, des informations sur votre appareil et votre système d’exploitation, les pages demandées, ainsi que la date et l’heure de chaque requête. Les journaux serveur et applicatifs conservent ces éléments afin de maintenir le service et de détecter les abus.
- **Préférences stockées dans votre navigateur :** votre langue, votre devise et le contenu de votre panier. Elles sont stockées sur votre appareil et décrites dans notre Notice sur les cookies et le suivi.

Nous ne demandons **pas** de numéro de carte bancaire ni de coordonnées bancaires, et ce site n’en collecte pas. Aucun formulaire de paiement en ligne n’existe sur ce site.

## 2. Sources des données

Nous collectons les données directement auprès de vous, automatiquement depuis votre appareil lors de votre navigation et, le cas échéant, depuis les journaux de sécurité de nos prestataires d’hébergement et d’infrastructure.

## 3. Finalités

- Répondre à votre demande et organiser, confirmer et livrer votre commande.
- Vous envoyer notre newsletter, uniquement si vous l’avez demandé.
- Assurer la sécurité du site, prévenir les abus et diagnostiquer les problèmes techniques.
- Conserver les registres que nous devons conserver et faire valoir ou défendre des droits en justice.

## 4. Avec qui nous les partageons

Nous ne vendons pas de données personnelles et nous ne les partageons pas avec des tiers à des fins de marketing propre.

Nous les partageons uniquement avec :

- **Des prestataires** qui hébergent le site, stockent nos données et livrent nos commandes, agissant sur nos instructions.
- **Les plateformes de messagerie** par lesquelles vous choisissez de nous contacter. Lorsque vous poursuivez une conversation sur un service tiers, ce service traite votre message selon sa propre politique de confidentialité, et non la nôtre.
- **Les autorités ou conseils**, lorsque la loi l’exige ou lorsque cela est nécessaire pour établir, exercer ou défendre des droits en justice.

## 5. Durée de conservation

- Messages de contact : conservés pendant le traitement de votre demande et pendant une durée raisonnable ensuite, à titre d’archive.
- Inscriptions à la newsletter : jusqu’à votre désinscription ou votre demande de suppression.
- Journaux de sécurité et de serveur : conservés pendant une courte durée adaptée à la surveillance de sécurité.

Nous supprimons ou anonymisons les données lorsque nous n’avons plus de raison de les conserver.

## 6. Sécurité

Nous appliquons des mesures techniques et organisationnelles adaptées au risque : connexions chiffrées, identifiants d’administration hachés, contrôles d’accès sur nos outils d’administration, et conservation d’une forme hachée plutôt qu’en clair des adresses IP figurant dans nos enregistrements. Aucune méthode de transmission ou de stockage n’est totalement sûre et nous ne pouvons garantir une sécurité absolue.

## 7. Vos choix

Vous pouvez nous demander de :

- confirmer quelles données personnelles nous détenons à votre sujet ;
- corriger des informations inexactes ;
- supprimer des informations que nous n’avons plus besoin de conserver ;
- cesser de vous envoyer des messages marketing.

Veuillez nous contacter à l’aide des coordonnées de la section 12 en précisant votre demande. Nous pourrons vous demander des éléments permettant de vérifier votre identité, afin de ne pas communiquer vos données à un tiers.

## 8. Droits en Californie

Si vous résidez en Californie, le CalOPPA nous impose d’indiquer les catégories de données personnelles identifiables que nous collectons et l’usage que nous en faisons — sections 1 à 5 ci-dessus — et de préciser comment nous vous informons des changements, ce que fait la section 11.

Les droits supplémentaires prévus par le California Consumer Privacy Act (CCPA/CPRA) ne s’appliquent qu’aux entreprises atteignant les seuils fixés par cette loi. Si et lorsque {{brandName}} atteindra ces seuils, nous publierons les informations et mécanismes de demande supplémentaires exigés et mettrons cette section à jour. Entre-temps, nous répondrons de bonne foi à toute demande raisonnable concernant vos données.

## 9. « Do Not Track » et signaux du navigateur

Certains navigateurs envoient un signal « Do Not Track » ou Global Privacy Control. Il n’existe pas de norme commune quant à la réponse à y apporter. Ce site n’utilise ni publicité tierce ni outil d’analyse inter-sites ; il n’existe donc aucun suivi inter-sites qu’un tel signal pourrait désactiver. Si nous introduisions un suivi non essentiel à l’avenir, nous mettrions cette politique à jour et proposerions un moyen de donner ou de refuser votre consentement au préalable.

## 10. Enfants

Cette boutique ne s’adresse pas aux enfants de moins de 13 ans et nous ne collectons pas sciemment leurs données personnelles. Si vous pensez qu’un enfant nous a transmis des données, contactez-nous et nous les supprimerons.

## 11. Modifications

Nous pouvons mettre à jour cette politique. La date d’entrée en vigueur en haut de page indique sa dernière modification. Les changements importants seront publiés sur cette page avant leur prise d’effet.

## 12. Nous contacter

{{#if privacyContactEmail}}Demandes relatives à la confidentialité : {{privacyContactEmail}}{{/if}}
{{#if supportEmail}}E-mail : {{supportEmail}}{{/if}}
{{#if phone}}Téléphone : {{phone}}{{/if}}
{{#if businessAddress}}Adresse : {{businessAddress}}{{/if}}

Si aucune coordonnée n’apparaît ci-dessus, veuillez utiliser le formulaire de notre page Contact.`,
  },

  shipping: {
    title: 'Politique d’expédition et de livraison',
    seoDescription: 'Où Mian Dubai livre actuellement, les délais habituels et la manière dont la livraison est confirmée.',
    content: `## Où nous livrons

Nous livrons actuellement dans la zone suivante : **{{shippingRegion}}**.

Si vous êtes en dehors de cette zone et souhaitez commander, contactez-nous. Nous vous dirons honnêtement si nous pouvons vous aider plutôt que d’accepter une commande que nous ne pourrions pas honorer.

## Délai de livraison estimé

Notre estimation actuelle est de **{{deliveryMinDays}} à {{deliveryMaxDays}} jours ouvrés** à compter de la confirmation de votre commande.

Les jours ouvrés s’entendent du lundi au vendredi, hors jours fériés. Certains produits peuvent afficher une estimation différente sur leur fiche : celle-ci prévaut alors.

Il s’agit d’une **estimation, et non d’une date de livraison garantie.** La livraison peut prendre plus de temps en raison :

- de retards ou de perturbations du transporteur ;
- des conditions météorologiques ou d’autres circonstances indépendantes de notre volonté ;
- d’une adresse incomplète ou incorrecte ;
- de contraintes opérationnelles telles que la vérification des stocks ou le volume de préparation ;
- des jours fériés.

## Délai de préparation

Lorsqu’un produit nécessite un temps de préparation avant expédition, celui-ci est indiqué sur sa fiche. En l’absence d’indication, l’estimation ci-dessus constitue le délai complet.

## Organisation de la livraison

Le paiement n’étant pas encaissé sur ce site, l’adresse de livraison, le délai et les éventuels frais sont confirmés directement avec vous avant la finalisation de votre commande. Vérifiez attentivement l’adresse à ce moment-là : nous ne pouvons pas rediriger un colis déjà remis au transporteur.

{{#if freeShippingEnabled}}
## Frais de livraison

La livraison offerte s’applique actuellement aux commandes éligibles. Le montant exact, ou la confirmation qu’aucun frais ne s’applique, vous est communiqué avant la confirmation de votre commande.
{{/if}}

## Disponibilité

Les niveaux de stock affichés reflètent nos enregistrements au moment du chargement de la page. La disponibilité est revérifiée lors de la confirmation de votre commande. Si un article s’est épuisé entre-temps, nous vous en informerons rapidement et vous proposerons une alternative ou annulerons cette ligne.

## En cas de problème

Si votre commande n’est pas arrivée dans un délai raisonnable après l’estimation, ou si elle arrive endommagée, contactez-nous{{#if supportEmail}} à {{supportEmail}}{{/if}} dès que possible. Conservez l’emballage : le transporteur peut avoir besoin de l’examiner.

Notre Politique de retour et de remboursement explique la suite pour les articles endommagés, défectueux ou erronés.`,
  },

  returns: {
    title: 'Politique de retour et de remboursement',
    seoDescription: 'Comment demander un retour ou un remboursement auprès de Mian Dubai, y compris les règles d’hygiène applicables aux parfums ouverts.',
    content: `Nous souhaitons que votre parfum vous satisfasse. Cette politique explique quand un article peut être retourné et comment engager la démarche.

## Délai pour demander un retour

Contactez-nous dans les **{{returnWindowDays}} jours** suivant la réception de votre commande si vous souhaitez retourner un article. Indiquez le détail de votre commande et la nature du problème.

## Ce que nous corrigerons toujours

Que l’article ait été ouvert ou non, nous remplacerons ou rembourserons un produit qui est :

- **le mauvais article** — non conforme à ce qui a été confirmé ;
- **endommagé pendant le transport** ;
- **défectueux** — par exemple un vaporisateur défaillant, un flacon qui fuit, ou un produit qui n’est pas dans l’état attendu.

Signalez-nous le problème dès que vous le constatez et conservez l’emballage si possible. Des photographies permettent généralement de traiter ces cas rapidement.

## Articles non ouverts

Un article non ouvert, dans son emballage d’origine scellé et en état d’être revendu, peut être retourné dans le délai indiqué ci-dessus.

## Parfums ouverts ou utilisés

Le parfum est un produit pour lequel l’hygiène et la sécurité comptent. **Une fois un flacon ouvert ou utilisé, nous ne pouvons généralement pas le reprendre en vue d’une revente** et nous pouvons refuser le retour pour ce motif.

Cette restriction ne s’applique pas aux situations listées ci-dessus sous « Ce que nous corrigerons toujours » et n’affecte aucun droit que la loi applicable ne permet pas d’écarter — notamment les droits relatifs aux produits de qualité insatisfaisante, non conformes à leur description ou dangereux.

## Comment engager un retour

1. Contactez-nous{{#if supportEmail}} à {{supportEmail}}{{/if}} dans le délai indiqué, avec le détail de votre commande et la description du problème.
2. Nous vous confirmerons si l’article est éligible et vous indiquerons la marche à suivre. **Attendez cette confirmation avant de renvoyer quoi que ce soit** — nous vous transmettrons alors les informations de retour correctes.
3. Une fois l’article reçu et inspecté, nous vous confirmerons l’issue.

## Remboursements

Lorsqu’un remboursement est dû, il est effectué selon le même moyen que celui utilisé pour payer la commande, sauf accord contraire. Nous vous informerons de son émission ; le délai de réception dépend ensuite de votre banque ou de votre prestataire de paiement.

## Frais de retour

Lorsque le retour résulte de notre erreur — article erroné, endommagé ou défectueux — nous prenons en charge les frais de retour. Dans les autres cas, ces frais vous incombent normalement et nous vous le dirons clairement avant tout envoi.

## Questions

{{#if supportEmail}}E-mail : {{supportEmail}}{{/if}}
{{#if phone}}Téléphone : {{phone}}{{/if}}

Ou utilisez le formulaire de notre page Contact.`,
  },

  'product-safety': {
    title: 'Sécurité des produits et avertissement parfum',
    seoDescription: 'Informations de sécurité pour l’utilisation des parfums Mian Dubai : sensibilité, conservation et inflammabilité.',
    content: `Veuillez lire cette page en complément des informations imprimées sur l’emballage du produit. **L’emballage et l’étiquette fournis avec le produit priment toujours sur cette page.**

## Usage général

- Les parfums sont destinés à un **usage externe uniquement**.
- Suivez les instructions et avertissements figurant sur l’étiquette.
- Évitez tout contact direct avec les yeux. En cas de contact, rincez abondamment à l’eau et consultez si l’irritation persiste.
- Ne pas avaler. Tenir hors de portée des enfants.
- Appliquez sur la peau ou les vêtements comme indiqué. Certains parfums peuvent marquer les tissus délicats.

## Sensibilité

Les parfums peuvent contenir des ingrédients provoquant une sensibilité ou une réaction allergique chez certaines personnes, même en cas d’usage conforme.

- Si vous avez la peau sensible ou une allergie connue aux parfums, consultez la liste d’ingrédients sur la fiche produit et sur l’emballage avant utilisation.
- Envisagez de tester une petite quantité sur une zone discrète de la peau.
- **Cessez l’utilisation en cas d’irritation, de rougeur ou de gêne.** Consultez un médecin si la réaction persiste ou est sévère.

## Inflammabilité

De nombreux parfums contiennent de l’alcool et sont inflammables.

- Tenir à l’écart de la chaleur, des étincelles, des flammes nues et de toute source d’inflammation.
- Ne pas vaporiser près d’une flamme ni sur une surface allumée.
- Ne pas perforer ni brûler le contenant, même vide.

## Conservation

Conservez le produit dans son emballage d’origine, à la verticale, à l’abri de la lumière directe du soleil et des fortes chaleurs ou variations de température. Le parfum évolue avec le temps, et la chaleur et la lumière accélèrent cette évolution.

## Ingrédients

Lorsqu’une liste d’ingrédients figure sur une fiche produit, elle reproduit la déclaration fournie pour ce produit. Si vous avez besoin de la liste complète et à jour pour un lot précis, référez-vous à l’emballage reçu ou contactez-nous.

## Aucune allégation de santé

Nos produits sont des parfums. Rien sur ce site ne constitue une allégation selon laquelle un produit traiterait, préviendrait ou soulagerait une affection médicale, psychologique ou dermatologique, et rien ici ne constitue un avis médical. En cas de préoccupation de santé, consultez un professionnel de santé qualifié.

## Grossesse, enfants et pathologies

Si vous êtes enceinte ou allaitez, ou si vous souffrez d’une affection cutanée ou respiratoire, consultez un professionnel de santé qualifié avant d’utiliser un nouveau parfum.

## Contact

{{#if supportEmail}}Pour toute question de sécurité concernant un produit reçu, écrivez-nous à {{supportEmail}}.{{/if}}
En cas de réaction grave, consultez d’abord un médecin, puis informez-nous afin que nous puissions enquêter.`,
  },

  cookies: {
    title: 'Notice sur les cookies et le suivi',
    seoDescription: 'Ce que Mian Dubai stocke dans votre navigateur et pourquoi. Aucun traceur publicitaire ni analytique n’est utilisé.',
    content: `Cette notice décrit ce que ce site stocke sur votre appareil et pourquoi. Elle reflète le fonctionnement réel du site — nous n’y listons pas de cookies que nous ne déposons pas.

## Ce que nous utilisons actuellement

**Préférences stockées dans votre navigateur (stockage local)**

- **Préférence de langue** — pour que le site s’ouvre dans la langue choisie.
- **Préférence de devise** — pour afficher les prix dans la devise choisie.
- **Contenu du panier** — pour que votre panier survive à un rechargement de page.

Ces éléments sont stockés sur votre appareil par votre navigateur. Ils ne nous sont pas transmis sous forme de cookies et nous ne pouvons pas les lire depuis nos serveurs.

**Cookies de session administrateur**

Lorsqu’un membre de l’équipe Mian Dubai se connecte à l’espace d’administration, nous déposons un cookie de session et un cookie de protection CSRF. Ils sont strictement nécessaires au fonctionnement sécurisé de cet espace et ne sont pas déposés pour les visiteurs de la boutique.

**Journalisation de sécurité**

Nos serveurs conservent de courts journaux de requêtes, comme décrit dans notre Politique de confidentialité. Ce ne sont pas des cookies, mais nous les mentionnons par souci d’exhaustivité.

## Ce que nous n’utilisons pas

À la date de rédaction, ce site n’utilise **pas** :

- de traceurs publicitaires ou de reciblage ;
- d’outils d’analyse tiers tels que Google Analytics ;
- de pixels de réseaux sociaux tels que Meta ou TikTok ;
- de suivi inter-sites, quel qu’il soit.

C’est pourquoi aucune bannière de consentement ne vous est présentée : il n’y a actuellement rien de non essentiel à consentir. Nous préférons ne pas vous interrompre avec une bannière sans objet.

## Si cela change

Si nous ajoutons plus tard des technologies d’analyse ou de marketing, nous mettrons cette notice à jour et mettrons en place un mécanisme de consentement approprié **avant** toute utilisation d’un suivi non essentiel.

## Gérer le stockage dans votre navigateur

Vous pouvez effacer les données du site ou bloquer le stockage via les réglages de votre navigateur. Vos préférences de langue, de devise et votre panier seront alors oubliés et le site reviendra à ses valeurs par défaut.

## Contact

{{#if supportEmail}}Questions sur cette notice : {{supportEmail}}{{/if}}
Ou utilisez le formulaire de notre page Contact.`,
  },

  accessibility: {
    title: 'Déclaration d’accessibilité',
    seoDescription: 'L’engagement de Mian Dubai en faveur d’un site accessible et comment nous signaler un obstacle.',
    content: `{{brandName}} souhaite que chacun puisse découvrir ses parfums et nous joindre. Cette déclaration explique où nous en sommes et comment nous signaler un manquement.

## Notre objectif

Nous visons les **Règles pour l’accessibilité des contenus Web (WCAG) 2.2, niveau AA**. Nous considérons cela comme un engagement continu, et non comme une opération ponctuelle.

## Ce que nous avons intégré

- Une structure HTML sémantique avec un ordre de titres logique et des repères de page.
- Un lien « aller au contenu » et une utilisation entièrement au clavier, y compris les menus, les filtres, la recherche et le panier.
- Des indicateurs de focus visibles sur chaque élément interactif.
- Des libellés associés à chaque champ de formulaire et des messages d’erreur annoncés, et non signalés par la seule couleur.
- Des textes alternatifs pour les visuels produits, modifiables par notre équipe image par image.
- Des combinaisons de couleurs choisies pour respecter les rapports de contraste AA pour le texte.
- La prise en charge du réglage « réduire les animations » de votre système : les animations décoratives sont supprimées si vous avez demandé moins de mouvement.
- Des mises en page qui passent en colonne unique sur petits écrans, sans défilement horizontal, et qui tolèrent un agrandissement du texte.

## Limites connues

- Lorsqu’une image produit a été fournie sans texte alternatif, nous générons une description de repli à partir du nom du produit. Elle est exacte mais moins précise qu’un texte rédigé par une personne.
- Les services tiers accessibles depuis notre site — par exemple une messagerie utilisée pour finaliser une commande — échappent à notre contrôle et possèdent leurs propres caractéristiques d’accessibilité.

## Signalez-nous un obstacle

Si un élément du site vous empêche de faire ce pour quoi vous êtes venu, dites-le-nous. Décrivez la page et ce qui s’est passé : nous travaillerons avec vous pour vous fournir l’information ou le produit recherché.

{{#if supportEmail}}E-mail : {{supportEmail}}{{/if}}
{{#if phone}}Téléphone : {{phone}}{{/if}}

Nous prenons ces signalements au sérieux et répondrons aussi rapidement que raisonnablement possible.

## Autres moyens de nous joindre

Si vous ne parvenez pas à effectuer une action sur le site, contactez-nous directement : un membre de notre équipe vous accompagnera personnellement pour votre demande ou votre commande.`,
  },
};
