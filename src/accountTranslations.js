// Copy for the account pages, the order lifecycle, and the admin approval
// console. Kept beside authTranslations so translations.js stays readable.
export const accountTranslations = {
  en: {
    back: 'Back',
    done: 'Done',

    accountOrdersSection: 'Your food',
    accountSettingsSection: 'Account',
    accountOrders: 'Orders',
    accountOrdersHint: '{active} in progress · {past} past',
    accountFavorites: 'Favorites',
    accountFavoritesHint: '{count} saved',
    accountPromotions: 'Promotions',
    accountPromotionsHint: 'Current offers and perks',
    accountManageProfile: 'Manage profile',
    accountManageProfileHint: 'Name, photo, phone, and address',
    accountHelp: 'Help',
    accountHelpHint: 'Answers and ways to reach us',

    ordersSubtitle: 'Track what is cooking and look back at past pickups.',
    ordersActive: 'In progress',
    ordersPast: 'Past',
    ordersEmptyActive: 'No orders in progress. Your next pickup will show up here.',
    ordersEmptyPast: 'No past orders yet.',
    ordersLoadError: 'We could not load your orders. Check your connection and retry.',

    statusAwaiting: 'Awaiting approval',
    statusApproved: 'Approved',
    statusDenied: 'Not approved',
    statusPreparing: 'Preparing',
    statusReady: 'Ready for pickup',
    statusCompleted: 'Completed',
    statusCancelled: 'Cancelled',
    paymentVerified: 'payment verified',
    referenceNumber: 'Reference number',
    adminNote: 'Note from Enzo Eats',

    favoritesSubtitle: 'The dishes you saved from the menu.',
    favoritesEmptyTitle: 'No favorites yet',
    favoritesEmptyText: 'Tap the heart on any dish to keep it here.',

    promotionsSubtitle: 'What is on offer right now.',
    promoPickupTitle: 'Pickup, always free',
    promoPickupBody: 'No delivery fee and no service charge — collect your order at the counter.',
    promoGcashTitle: 'Pay ahead with GCash',
    promoGcashBody: 'Send payment before pickup and skip handling cash at the counter.',
    promotionsNote: 'Offers may change. The price shown at checkout is always the price you pay.',

    helpSubtitle: 'Common questions about orders and payment.',
    helpContactSection: 'Still need a hand?',
    helpEmail: 'Email support',
    helpText: 'Text us',
    faqReferenceQ: 'Why do you need my GCash reference number?',
    faqReferenceA:
      'GCash does not tell us automatically that a payment arrived. The reference number on your receipt is how we match your payment to your order and confirm it before we start cooking.',
    faqApprovalQ: 'Why is my order waiting for approval?',
    faqApprovalA:
      'Every order is checked by the Enzo Eats team before it goes to the kitchen — we confirm your payment or, for cash, that we can hold the order for you. You will see the status change here as soon as a decision is made.',
    faqDeniedQ: 'What happens if my order is not approved?',
    faqDeniedA:
      'The order moves to "Not approved" with a note explaining why, and nothing is cooked. If you had already paid, contact us and we will return your payment.',
    faqPickupQ: 'Where do I collect my order?',
    faqPickupA:
      'At the Enzo Eats counter. Bring your order number — and for GCash, your payment confirmation.',

    profilePhotoHint: 'Your initials appear on your account and beside your orders.',
    profileEmailHint: 'Your email is your sign-in and cannot be changed here.',

    adminSection: 'Staff',
    adminApprovals: 'Order approvals',
    adminApprovalsHint: 'Review orders waiting on a decision',
    adminSubtitle: 'Approve or deny orders before they reach the kitchen.',
    adminLiveNotice:
      'This list updates by itself as orders come in. Approving sends the order to the kitchen; denying tells the customer it was not approved.',
    adminEmpty: 'Nothing is waiting for a decision right now.',
    adminQueueCount: '{count} orders awaiting a decision',
    adminApprove: 'Approve',
    adminDeny: 'Deny',
    adminNoteLabel: 'Note for the customer',
    adminNotePlaceholder: 'Optional note for the customer',

    cashApprovalNotice:
      'Cash orders are confirmed by our team before cooking starts. You will see the decision in your orders.',
    gcashReferenceExplainer:
      'GCash does not notify us automatically, so we need the reference number from your GCash receipt to confirm your payment. You will be asked for it on the next step.',

    gcashRefTitle: 'Enter your GCash reference number',
    gcashRefBody:
      'Send ₱{amount} via GCash first, then copy the reference number from your GCash receipt. Our team checks it against the payment before approving your order.',
    gcashRefLabel: 'GCash reference number',
    submitReference: 'Submit and place order',
    backToBag: 'Back to bag',

    orderPlacedTitle: 'Order placed',
    orderPlacedBody:
      'Order {number} has been sent to the Enzo Eats team for approval. You will see the decision in your orders.',

    orderErrorEmptyCart: 'Your bag is empty.',
    orderErrorCartTooLarge: 'That is too many items for one order. Please split it up.',
    orderErrorUnknownItem: 'One of those dishes is no longer on the menu. Please rebuild your bag.',
    orderErrorQuantity: 'Please check the quantities in your bag.',
    orderErrorGcashReference:
      'Enter the reference number from your GCash receipt — 10 to 16 digits.',
    orderErrorProfile: 'Complete your name, phone number, and email before ordering.',
    orderErrorSignedOut: 'Please sign in again to place your order.',
    orderErrorNotAuthorized: 'You do not have permission to do that.',
    orderErrorNotFound: 'That order no longer exists.',
    orderErrorAlreadyDecided: 'That order has already been decided.',
    orderErrorFailed: 'We could not place your order. Please try again.',
  },
  tl: {
    back: 'Bumalik',
    done: 'Tapos na',

    accountOrdersSection: 'Ang pagkain mo',
    accountSettingsSection: 'Account',
    accountOrders: 'Mga order',
    accountOrdersHint: '{active} kasalukuyan · {past} nakaraan',
    accountFavorites: 'Mga paborito',
    accountFavoritesHint: '{count} na-save',
    accountPromotions: 'Mga promo',
    accountPromotionsHint: 'Mga kasalukuyang alok',
    accountManageProfile: 'Pamahalaan ang profile',
    accountManageProfileHint: 'Pangalan, larawan, telepono, at address',
    accountHelp: 'Tulong',
    accountHelpHint: 'Mga sagot at paraan para makausap kami',

    ordersSubtitle: 'Subaybayan ang niluluto at tingnan ang mga nakaraang pickup.',
    ordersActive: 'Kasalukuyan',
    ordersPast: 'Nakaraan',
    ordersEmptyActive: 'Walang kasalukuyang order. Dito lalabas ang susunod mong pickup.',
    ordersEmptyPast: 'Wala pang nakaraang order.',
    ordersLoadError: 'Hindi na-load ang mga order mo. Tingnan ang koneksyon at subukan ulit.',

    statusAwaiting: 'Hinihintay ang aprubahan',
    statusApproved: 'Aprubado',
    statusDenied: 'Hindi aprubado',
    statusPreparing: 'Inihahanda',
    statusReady: 'Handa nang kunin',
    statusCompleted: 'Tapos na',
    statusCancelled: 'Kanselado',
    paymentVerified: 'napatunayan ang bayad',
    referenceNumber: 'Reference number',
    adminNote: 'Paalala mula sa Enzo Eats',

    favoritesSubtitle: 'Ang mga putaheng na-save mo mula sa menu.',
    favoritesEmptyTitle: 'Wala pang paborito',
    favoritesEmptyText: 'Pindutin ang puso sa anumang putahe para mailagay dito.',

    promotionsSubtitle: 'Ang mga alok ngayon.',
    promoPickupTitle: 'Libre ang pickup',
    promoPickupBody:
      'Walang delivery fee at walang service charge — kunin ang order mo sa counter.',
    promoGcashTitle: 'Magbayad nang maaga gamit ang GCash',
    promoGcashBody: 'Magbayad bago ang pickup at hindi na kailangang maghawak ng cash sa counter.',
    promotionsNote:
      'Maaaring magbago ang mga alok. Ang presyong nakikita sa checkout ang palaging babayaran mo.',

    helpSubtitle: 'Mga karaniwang tanong tungkol sa order at bayad.',
    helpContactSection: 'Kailangan mo pa ng tulong?',
    helpEmail: 'Email support',
    helpText: 'Mag-text sa amin',
    faqReferenceQ: 'Bakit kailangan ang GCash reference number ko?',
    faqReferenceA:
      'Hindi awtomatikong sinasabi ng GCash sa amin na may dumating na bayad. Ang reference number sa resibo mo ang ginagamit namin para itugma ang bayad sa order mo at kumpirmahin ito bago kami magluto.',
    faqApprovalQ: 'Bakit naghihintay ng aprubahan ang order ko?',
    faqApprovalA:
      'Tinitingnan ng Enzo Eats ang bawat order bago ito ipadala sa kusina — kinukumpirma namin ang bayad o, para sa cash, na kaya naming itabi ang order para sa iyo. Makikita mo agad dito ang pagbabago ng status.',
    faqDeniedQ: 'Ano ang mangyayari kung hindi aprubado ang order ko?',
    faqDeniedA:
      'Magiging "Hindi aprubado" ang order na may paliwanag kung bakit, at walang lulutuin. Kung nakabayad ka na, kontakin kami at ibabalik namin ang bayad mo.',
    faqPickupQ: 'Saan ko kukunin ang order ko?',
    faqPickupA:
      'Sa counter ng Enzo Eats. Dalhin ang order number mo — at para sa GCash, ang kumpirmasyon ng bayad.',

    profilePhotoHint: 'Lalabas ang initials mo sa account mo at katabi ng mga order mo.',
    profileEmailHint: 'Ang email mo ang sign-in mo at hindi ito mapapalitan dito.',

    adminSection: 'Staff',
    adminApprovals: 'Pag-apruba ng order',
    adminApprovalsHint: 'Suriin ang mga order na naghihintay ng desisyon',
    adminSubtitle: 'Aprubahan o tanggihan ang mga order bago mapunta sa kusina.',
    adminLiveNotice:
      'Kusang nag-a-update ang listahang ito habang dumarating ang mga order. Ang pag-apruba ay nagpapadala ng order sa kusina; ang pagtanggi ay nagpapaalam sa customer na hindi ito aprubado.',
    adminEmpty: 'Walang naghihintay ng desisyon ngayon.',
    adminQueueCount: '{count} order ang naghihintay ng desisyon',
    adminApprove: 'Aprubahan',
    adminDeny: 'Tanggihan',
    adminNoteLabel: 'Paalala para sa customer',
    adminNotePlaceholder: 'Opsyonal na paalala para sa customer',

    cashApprovalNotice:
      'Kinukumpirma ng team namin ang mga cash order bago magsimula ang pagluluto. Makikita mo ang desisyon sa mga order mo.',
    gcashReferenceExplainer:
      'Hindi kami awtomatikong inaabisuhan ng GCash, kaya kailangan namin ang reference number mula sa GCash receipt mo para makumpirma ang bayad. Hihingin ito sa susunod na hakbang.',

    gcashRefTitle: 'Ilagay ang GCash reference number mo',
    gcashRefBody:
      'Magpadala muna ng ₱{amount} gamit ang GCash, pagkatapos kopyahin ang reference number sa GCash receipt mo. Tinitingnan ito ng team namin laban sa bayad bago aprubahan ang order mo.',
    gcashRefLabel: 'GCash reference number',
    submitReference: 'Isumite at i-order',
    backToBag: 'Bumalik sa bag',

    orderPlacedTitle: 'Na-order na',
    orderPlacedBody:
      'Naipadala na ang order {number} sa Enzo Eats para aprubahan. Makikita mo ang desisyon sa mga order mo.',

    orderErrorEmptyCart: 'Walang laman ang bag mo.',
    orderErrorCartTooLarge: 'Masyadong maraming item para sa isang order. Pakihati ito.',
    orderErrorUnknownItem:
      'Wala na sa menu ang isa sa mga putaheng iyon. Pakiayos muli ang bag mo.',
    orderErrorQuantity: 'Pakitingnan ang dami ng mga item sa bag mo.',
    orderErrorGcashReference:
      'Ilagay ang reference number mula sa GCash receipt mo — 10 hanggang 16 na numero.',
    orderErrorProfile: 'Kumpletuhin ang pangalan, telepono, at email mo bago mag-order.',
    orderErrorSignedOut: 'Mag-sign in ulit para mailagay ang order mo.',
    orderErrorNotAuthorized: 'Wala kang pahintulot para diyan.',
    orderErrorNotFound: 'Wala na ang order na iyon.',
    orderErrorAlreadyDecided: 'May desisyon na ang order na iyon.',
    orderErrorFailed: 'Hindi namin nailagay ang order mo. Pakisubukan ulit.',
  },
}
