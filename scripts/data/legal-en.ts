/**
 * English starter text for the seven policy pages.
 *
 * Placeholders in `{{token}}` form are resolved by the storefront from site
 * settings, and `{{#if token}}...{{/if}}` blocks disappear entirely while the
 * value is blank. That is why no address, company form, county or contact
 * detail is invented anywhere in this file.
 *
 * This is professional starter wording, not legal advice. Have it reviewed
 * before trading.
 */
export const LEGAL_EN: Record<string, { title: string; content: string; seoDescription: string }> = {
  terms: {
    title: 'Terms of Use and Terms of Sale',
    seoDescription: 'The terms that apply when you use the Mian Dubai website and when you place an order with us.',
    content: `These terms apply to your use of this website and to any order you place with {{brandName}}{{#if legalEntityName}} ({{legalEntityName}}){{/if}} ("Mian Dubai", "we", "us", "our"). Please read them before using the site or placing an order.

## 1. Using this website

You may browse, search and use this website for your own personal, non-commercial purposes. You agree not to misuse the site — for example by attempting to gain unauthorised access, interfering with its operation, scraping it at a scale that degrades service for others, or using it for any unlawful purpose.

The content of this site, including text, layout, photography, graphics and the Mian Dubai name and logo, belongs to us or to our licensors. You may not copy or reuse it for commercial purposes without our written permission.

## 2. How orders are placed

We do not currently take payment online. Orders are arranged directly with us, and our website will direct you to a messaging or contact channel to complete your request.

Adding items to your bag, or sending us a list of items, is a **request** — not a completed purchase. An order exists only once we have confirmed with you:

- that the items are available;
- the final price, including any delivery charge and applicable taxes;
- the delivery address and estimated timescale;
- how payment will be arranged.

We may decline or cancel a request before it is confirmed — for example if an item has sold out, if there has been a pricing or description error, or if we cannot deliver to the address given.

## 3. Prices and product information

Prices shown on the site are in the currency you have selected. Where an AED figure is shown alongside a USD price, it may be converted using an internal reference rate and is indicative only; the amount confirmed with you at the time of your order is the amount that applies.

We work to describe our fragrances accurately. Colours, packaging and presentation may vary slightly from the images shown because of photography, lighting and your own screen. Bottle sizes and fragrance concentrations are stated on each product page.

## 4. Availability and delivery

We currently deliver within {{shippingRegion}}. Delivery estimates are given in business days and are estimates, not guarantees. Please see our Shipping & Delivery Policy for the detail.

## 5. Returns

Your rights and the process are set out in our Returns & Refund Policy. Nothing in these terms limits any right you have under applicable law that cannot be limited.

## 6. Product safety

Fragrance products are for external use only and may contain ingredients that cause sensitivity in some people. Please read our Product Safety & Fragrance Disclaimer and the information on the product's own packaging, which always takes precedence over anything on this site.

## 7. Your information

We handle personal information as described in our Privacy Policy.

## 8. Availability of the website

We aim to keep the site available, but we may suspend, withdraw or change any part of it — including individual products — without notice. We do not guarantee that the site will always be available or free of errors.

## 9. Our responsibility to you

To the fullest extent permitted by applicable law, we are not liable for indirect or consequential loss, loss of profit, or loss arising from your use of, or inability to use, this website.

Nothing in these terms excludes or limits our liability where it would be unlawful to do so. This includes liability for death or personal injury caused by negligence, for fraud or fraudulent misrepresentation, and any statutory rights relating to the products we sell that cannot lawfully be excluded.

## 10. Changes to these terms

We may update these terms. The version published on this page at the time you place an order is the version that applies to that order. The effective date is shown at the top of this page.

## 11. Governing law

These terms are governed by the laws of the State of {{governingLawState}}, United States, without regard to its conflict of law rules.{{#if governingLawVenue}} The courts located in {{governingLawVenue}} shall have jurisdiction over any dispute arising from them.{{/if}} This does not deprive you of the protection of mandatory consumer-protection rules available to you where you live.

## 12. Contact

{{#if supportEmail}}Email: {{supportEmail}}{{/if}}
{{#if phone}}Telephone: {{phone}}{{/if}}
{{#if businessAddress}}Address: {{businessAddress}}{{/if}}

If none of the above is shown, please use the contact form on our Contact page.`,
  },

  privacy: {
    title: 'Privacy Policy',
    seoDescription: 'How Mian Dubai collects, uses and protects personal information, including disclosures for California residents.',
    content: `This policy explains what personal information {{brandName}} collects through this website, why we collect it, and the choices you have. It is written with California's Online Privacy Protection Act (CalOPPA) in mind, because we currently serve customers in {{shippingRegion}}.

## 1. Categories of personal information we collect

**Information you give us directly**

- **Contact form:** your name, email address, an optional telephone number, the topic you select, and the content of your message.
- **Newsletter:** your email address and the language you were browsing in, if you choose to subscribe.
- **Order enquiries:** when you continue an order through a messaging channel, any information you send us there — typically your name, delivery address and order details.

**Information collected automatically**

- **Technical and security data:** your IP address, browser type and version, device and operating system information, the pages you request, and the date and time of each request. Web-server and application logs record this to keep the service available and to detect abuse.
- **Preferences stored in your browser:** your chosen language, your chosen currency and the contents of your shopping bag. These are stored on your own device and are described in our Cookie & Tracking Notice.

We do **not** ask for, and this website does not collect, payment card numbers or bank details. There is no online payment form on this site.

## 2. Sources of the information

We collect personal information directly from you, automatically from your device when you use the site, and — where relevant — from our hosting and infrastructure providers' security logs.

## 3. Why we use it

- To answer your enquiry and to arrange, confirm and deliver your order.
- To send you our newsletter, if and only if you have asked us to.
- To keep the website secure, prevent abuse and diagnose technical problems.
- To keep records we are required to keep, and to establish or defend legal claims.

## 4. Who we share it with

We do not sell personal information, and we do not share it with third parties for their own marketing purposes.

We share it only with:

- **Service providers** who host the website, store our data and deliver our orders, acting on our instructions.
- **Messaging platforms** you choose to contact us through. When you continue a conversation on a third-party messaging service, that service processes your message under its own privacy policy, not ours.
- **Authorities or advisers**, where we are required to do so by law or where it is necessary to establish, exercise or defend legal claims.

## 5. How long we keep it

- Contact messages: retained while we deal with your enquiry and for a reasonable period afterwards for our records.
- Newsletter subscriptions: until you unsubscribe or ask us to remove you.
- Security and server logs: retained for a short period appropriate to security monitoring.

We delete or anonymise personal information when we no longer have a reason to keep it.

## 6. Security

We use technical and organisational measures appropriate to the risk, including encrypted connections, hashed administrator credentials, access controls on our administration tools, and storing a hashed rather than plain form of IP addresses on records we retain. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.

## 7. Your choices and how to contact us

You may ask us to:

- confirm what personal information we hold about you;
- correct information that is inaccurate;
- delete information we no longer need to keep;
- stop sending you marketing messages.

Please contact us using the details in section 12 and describe what you would like us to do. We may need to ask for information to verify your identity before we act, so that we do not disclose your information to someone else.

## 8. California privacy rights

If you are a California resident, CalOPPA requires us to disclose the categories of personally identifiable information we collect and how we use it — set out in sections 1 to 5 above — and to tell you how we notify you of changes, which is set out in section 10.

Additional rights under the California Consumer Privacy Act (CCPA/CPRA) apply only to businesses that meet that Act's thresholds. If and when {{brandName}} meets those thresholds, we will publish the additional disclosures and request mechanisms that Act requires, and we will update this section accordingly. In the meantime we will still respond in good faith to reasonable requests about your information.

## 9. Do Not Track and browser signals

Some browsers send a "Do Not Track" or Global Privacy Control signal. There is no common industry standard for how sites must respond to these signals. This website does not run third-party advertising or cross-site analytics trackers, so there is no cross-site tracking behaviour for such a signal to switch off. If we introduce any non-essential tracking in the future, we will update this policy and provide a way to give or withhold consent before it is used.

## 10. Children

This store is not directed at children under 13, and we do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us and we will delete it.

## 11. Changes to this policy

We may update this policy. The effective date at the top of this page shows when it last changed. Material changes will be reflected on this page before they take effect.

## 12. Contact us

{{#if privacyContactEmail}}Privacy enquiries: {{privacyContactEmail}}{{/if}}
{{#if supportEmail}}Email: {{supportEmail}}{{/if}}
{{#if phone}}Telephone: {{phone}}{{/if}}
{{#if businessAddress}}Address: {{businessAddress}}{{/if}}

If no contact details are shown above, please use the contact form on our Contact page.`,
  },

  shipping: {
    title: 'Shipping and Delivery Policy',
    seoDescription: 'Where Mian Dubai currently delivers, how long delivery normally takes, and how delivery is confirmed.',
    content: `## Where we deliver

We are currently delivering within **{{shippingRegion}}**.

If you are outside this area and would like to order, please contact us. We will tell you honestly whether we can help rather than accepting an order we cannot fulfil.

## Estimated delivery time

Our current estimate is **{{deliveryMinDays}}–{{deliveryMaxDays}} business days** from the moment your order is confirmed.

Business days are Monday to Friday, excluding public holidays. Individual products may show a different estimate on their own product page, and that estimate takes precedence.

This is an **estimate, not a guaranteed delivery date.** Delivery can take longer than estimated because of:

- carrier delays or route disruption;
- weather and other conditions outside our control;
- incomplete or incorrect address details;
- operational issues such as stock checks or packing volume;
- public holidays.

## Processing time

Where a product requires preparation time before dispatch, that processing window is shown on the product page. Where no processing time is shown, the delivery estimate above is the full estimate.

## How delivery is arranged

Because payment is not taken on this website, the delivery address, timescale and any delivery charge are confirmed directly with you before your order is finalised. Please check the address carefully at that point — we cannot redirect a parcel that has already been collected by the carrier.

{{#if freeShippingEnabled}}
## Delivery charges

Free delivery currently applies to qualifying orders. The exact charge, or confirmation that no charge applies, is given to you before your order is confirmed.
{{/if}}

## Availability

Stock levels shown on the site reflect our records at the time the page loads. Availability is re-checked when your order is confirmed. If an item has sold out in the meantime, we will tell you promptly and offer an alternative or cancel that line.

## If something goes wrong

If your order has not arrived within a reasonable time after the estimate, or if it arrives damaged, please contact us{{#if supportEmail}} at {{supportEmail}}{{/if}} as soon as you can. Please keep the packaging, as the carrier may need to inspect it.

Our Returns & Refund Policy explains what happens next for damaged, defective or incorrect items.`,
  },

  returns: {
    title: 'Returns and Refund Policy',
    seoDescription: 'How to request a return or refund from Mian Dubai, including the hygiene rules that apply to opened fragrance.',
    content: `We want you to be happy with your fragrance. This policy explains when you can return an item and how to start the process.

## The window for requesting a return

Please contact us within **{{returnWindowDays}} days** of receiving your order if you would like to return something. Tell us your order details and what the problem is.

## Items we will always put right

Regardless of whether an item has been opened, we will replace or refund a product that is:

- **the wrong item** — not what was confirmed in your order;
- **damaged in transit**;
- **defective** — for example a faulty atomiser, a leaking bottle, or a product that is not in the condition it should be.

Please tell us as soon as you notice the problem, and keep the packaging where possible. Photographs usually help us resolve these cases quickly.

## Unopened items

An unopened item, in its original sealed packaging and in resalable condition, may be returned within the window above.

## Opened or used fragrance

Fragrance is a product where hygiene and safety matter. **Once a bottle has been opened or used, we are generally unable to accept it back for resale**, and we may decline a return on those grounds.

This restriction does not apply to the situations listed under "Items we will always put right" above, and it does not affect any right you have under applicable law that cannot be waived — including rights relating to products that are not of satisfactory quality, are not as described, or are unsafe.

## How to start a return

1. Contact us{{#if supportEmail}} at {{supportEmail}}{{/if}} within the window above, with your order details and a description of the issue.
2. We will confirm whether the item qualifies and tell you how to return it. **Please wait for that confirmation before sending anything back** — we will give you the correct return details at that point.
3. Once we have received and inspected the item, we will confirm the outcome.

## Refunds

Where a refund is due, it is made using the same method used to pay for the order, unless we agree something else with you. We will tell you when the refund has been issued; how quickly it reaches you then depends on your bank or payment provider.

## Return shipping costs

Where the return is because of our error — the wrong, damaged or defective item — we cover the cost of return shipping. In other cases the cost of returning the item is normally yours, and we will tell you clearly before you send anything.

## Questions

{{#if supportEmail}}Email: {{supportEmail}}{{/if}}
{{#if phone}}Telephone: {{phone}}{{/if}}

Or use the contact form on our Contact page.`,
  },

  'product-safety': {
    title: 'Product Safety and Fragrance Disclaimer',
    seoDescription: 'Safety information for using Mian Dubai fragrance products, including sensitivity, storage and flammability guidance.',
    content: `Please read this alongside the information printed on the product's own packaging. **The packaging and label supplied with the product always take precedence over this page.**

## General use

- Fragrance products are **for external use only**.
- Follow the instructions and warnings on the product label.
- Avoid direct contact with the eyes. If the product enters your eyes, rinse thoroughly with water and seek appropriate assistance if irritation persists.
- Do not swallow. Keep out of the reach of children.
- Apply to skin or clothing as directed. Some fragrances may mark delicate fabrics.

## Sensitivity

Fragrance products may contain ingredients that cause sensitivity or an allergic reaction in some individuals, even where the product is used as directed.

- If you have sensitive skin or a known fragrance allergy, review the ingredient declaration on the product page and on the packaging before use.
- Consider testing a small amount on a discreet area of skin first.
- **Discontinue use if irritation, redness or discomfort occurs.** Seek medical advice if a reaction persists or is severe.

## Flammability

Many fragrance products contain alcohol and are flammable.

- Keep away from heat, sparks, open flame and other sources of ignition.
- Do not spray near a flame or onto a lit surface.
- Do not pierce or burn the container, even when empty.

## Storage

Store the product in its original packaging, upright, away from direct sunlight and away from significant heat or temperature swings. Fragrance changes over time, and heat and light accelerate that change.

## Ingredients

Where an ingredient declaration is shown on a product page, it reproduces the declaration supplied for that product. If you need the full and current declaration for a specific batch, refer to the packaging you received or contact us.

## No health or therapeutic claims

Our products are fragrance products. Nothing on this website is a claim that any product treats, prevents, cures or alleviates any medical, psychological or dermatological condition, and nothing here is medical advice. If you have a health concern, please speak to a qualified healthcare professional.

## Pregnancy, children and medical conditions

If you are pregnant or breastfeeding, or if you have a skin or respiratory condition, please consult a qualified healthcare professional before using a new fragrance product.

## Contact

{{#if supportEmail}}If you have a safety question about a product you have received, contact us at {{supportEmail}}.{{/if}}
If you experience a serious reaction, seek medical attention first and let us know afterwards so we can look into it.`,
  },

  cookies: {
    title: 'Cookie and Tracking Notice',
    seoDescription: 'What Mian Dubai stores in your browser and why. No advertising or analytics trackers are used.',
    content: `This notice describes what this website stores on your device and why. It reflects what the site actually does — we have not listed cookies we do not set.

## What we currently use

**Preferences stored in your browser (local storage)**

- **Language preference** — so the site opens in the language you chose.
- **Currency preference** — so prices display in the currency you chose.
- **Shopping bag contents** — so your bag survives a page refresh.

These are stored on your own device by your browser. They are not sent to us as cookies, and we cannot read them from our servers.

**Administrator session cookies**

When a member of the Mian Dubai team signs in to the administration area, we set a session cookie and a CSRF-protection cookie. These are strictly necessary for that area to work securely. They are not set for ordinary visitors to the storefront.

**Security logging**

Our servers keep short-lived request logs, as described in our Privacy Policy. These are not cookies, but we mention them here so the picture is complete.

## What we do not use

At the time of writing, this website does **not** use:

- advertising or retargeting trackers;
- third-party analytics such as Google Analytics;
- social media pixels such as the Meta or TikTok pixel;
- cross-site tracking of any kind.

This is why you are not shown a consent banner: there is currently nothing non-essential to consent to. We would rather not interrupt you with a banner that does nothing.

## If that changes

If we later add analytics or marketing technology, we will update this notice and put an appropriate consent mechanism in place **before** any non-essential tracking is used.

## Managing storage in your browser

You can clear site data or block storage through your browser settings. If you do, your language, currency and bag preferences will be forgotten and the site will fall back to its defaults.

## Contact

{{#if supportEmail}}Questions about this notice: {{supportEmail}}{{/if}}
Or use the contact form on our Contact page.`,
  },

  accessibility: {
    title: 'Accessibility Statement',
    seoDescription: 'Mian Dubai’s commitment to an accessible website and how to report an accessibility barrier.',
    content: `{{brandName}} wants everyone to be able to browse our fragrances and reach us. This statement explains where we stand and how to tell us when we fall short.

## Our target

We aim to meet the **Web Content Accessibility Guidelines (WCAG) 2.2 at Level AA**. We treat that as an ongoing commitment rather than a one-off exercise.

## What we have built in

- Semantic HTML structure with a logical heading order and page landmarks.
- A "skip to content" link and full keyboard operation, including menus, filters, the search overlay and the shopping bag.
- Visible focus indicators on every interactive element.
- Labels associated with every form field, and error messages that are announced rather than conveyed by colour alone.
- Alternative text for product imagery, editable by our team for each image.
- Colour combinations chosen to meet AA contrast ratios for text.
- Support for the "reduced motion" setting in your operating system — decorative animation is suppressed when you have asked for less motion.
- Layouts that reflow to a single column on small screens without horizontal scrolling, and that tolerate increased text size.

## Known limitations

- Where a product image was supplied without alternative text, we generate a descriptive fallback from the product name. It is accurate but less specific than text written by a person.
- Third-party services you reach from our site — for example a messaging platform used to complete an order — are outside our control and have their own accessibility characteristics.

## Tell us about a barrier

If something on this site prevents you from doing what you came to do, please tell us. Describe the page and what happened, and we will work with you to get you the information or the product you were looking for.

{{#if supportEmail}}Email: {{supportEmail}}{{/if}}
{{#if phone}}Telephone: {{phone}}{{/if}}

We take these reports seriously and will respond as quickly as we reasonably can.

## Alternative ways to reach us

If you cannot complete something on the website, contact us directly and a member of our team will assist you with your enquiry or order personally.`,
  },
};
