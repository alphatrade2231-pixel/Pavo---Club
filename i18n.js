// Central translations (Arabic / English) + language state.
// Each entry is  key: [arabic, english].  Use {name} placeholders with t(key, {name: ...}).
const D = {
  /* ---- navigation / common ---- */
  'nav.home': ['الرئيسية', 'Home'], 'nav.players': ['اللاعبون', 'Players'], 'nav.matches': ['المباريات', 'Matches'],
  'nav.lineup': ['التشكيلة', 'Lineup'], 'nav.news': ['الأخبار', 'News'], 'nav.gallery': ['المعرض', 'Gallery'],
  'nav.menu': ['القائمة', 'Menu'], 'nav.skip': ['تخطي إلى المحتوى', 'Skip to content'],
  'lang.switch': ['English', 'العربية'], 'lang.switchLabel': ['Switch to English', 'التبديل إلى العربية'],
  'common.loading': ['جارٍ التحميل…', 'Loading…'], 'common.retry': ['إعادة المحاولة', 'Try again'],
  'common.save': ['حفظ', 'Save'], 'common.cancel': ['إلغاء', 'Cancel'], 'common.delete': ['حذف', 'Delete'],
  'common.edit': ['تعديل', 'Edit'], 'common.add': ['إضافة', 'Add'], 'common.close': ['إغلاق', 'Close'],
  'common.back': ['رجوع', 'Back'], 'common.search': ['بحث', 'Search'], 'common.all': ['الكل', 'All'],
  'common.yes': ['نعم', 'Yes'], 'common.no': ['لا', 'No'], 'common.actions': ['إجراءات', 'Actions'],
  'common.prev': ['السابق', 'Previous'], 'common.next': ['التالي', 'Next'], 'common.loadMore': ['عرض المزيد', 'Show more'],
  'common.page': ['صفحة {n} من {total}', 'Page {n} of {total}'], 'common.results': ['{n} نتيجة', '{n} results'],
  'common.none': ['غير متوفر', 'Not available'], 'common.viewAll': ['عرض الكل', 'View all'],
  'common.readMore': ['اقرأ المزيد', 'Read more'], 'common.published': ['منشور', 'Published'],
  'common.draft': ['مسودة', 'Draft'], 'common.hidden': ['مخفي', 'Hidden'], 'common.active': ['نشط', 'Active'],
  'common.inactive': ['غير نشط', 'Inactive'], 'common.optional': ['اختياري', 'Optional'],
  'common.ar': ['بالعربية', 'Arabic'], 'common.en': ['بالإنجليزية', 'English'], 'common.confirm': ['تأكيد', 'Confirm'],
  'common.cm': ['سم', 'cm'], 'common.kg': ['كجم', 'kg'], 'common.years': ['سنة', 'yrs'],
  'common.unsaved': ['تعديلات غير محفوظة', 'Unsaved changes'], 'common.saved': ['تم الحفظ', 'Saved'],
  'common.deleted': ['تم الحذف', 'Deleted'], 'common.optionalHint': ['اختياري', 'optional'],
  /* ---- errors ---- */
  'err.config': ['لم يتم إعداد الاتصال بـ Supabase بعد. عدّل الملف assets/js/config.js بعنوان المشروع والمفتاح العام.', 'Supabase is not configured yet. Edit assets/js/config.js with your project URL and publishable key.'],
  'err.load': ['تعذر تحميل البيانات. تحقق من الاتصال ثم أعد المحاولة.', 'Could not load the data. Check your connection and try again.'],
  'err.network': ['تعذر الاتصال بالخادم. تحقق من الإنترنت ثم أعد المحاولة.', 'Could not reach the server. Check your internet connection and try again.'],
  'err.forbidden': ['ليست لديك صلاحية لتنفيذ هذا الإجراء.', 'You do not have permission to do this.'],
  'err.unknown': ['حدث خطأ غير متوقع: {msg}', 'Something went wrong: {msg}'],
  'err.notFound': ['لم يتم العثور على المحتوى المطلوب.', 'The requested content was not found.'],
  'err.jersey': ['رقم القميص مستخدم بالفعل لدى لاعب نشط آخر.', 'That shirt number is already used by another active player.'],
  'err.fk': ['لا يمكن إتمام العملية لأن هذا العنصر مرتبط ببيانات أخرى (مثل تشكيلات). عطّله أو أخفِه بدلًا من حذفه.', 'This item is used by other records (for example lineups). Deactivate or hide it instead of deleting it.'],
  'err.matchLineup': ['لا يمكن حذف مباراة لها تشكيلة. احذف التشكيلة أولًا.', 'A match with a lineup cannot be deleted. Delete its lineup first.'],
  'err.tooMany': ['لا يمكن أن يزيد عدد الأساسيين عن 11 لاعبًا.', 'A lineup cannot have more than 11 starters.'],
  'err.need11': ['لا يمكن النشر: يجب أن تحتوي التشكيلة على 11 لاعبًا أساسيًا بالضبط.', 'Cannot publish: the lineup needs exactly 11 starters.'],
  'err.needGk': ['لا يمكن النشر: يجب أن يوجد حارس مرمى واحد بالضبط بين الأساسيين.', 'Cannot publish: exactly one goalkeeper is required among the starters.'],
  'err.draftExists': ['توجد مسودة لهذه المباراة. انشرها أو احذفها أولًا.', 'A draft already exists for this match. Publish or discard it first.'],
  'err.badScore': ['النتيجة لا تتوافق مع حالة المباراة. المباريات غير المبدوءة أو المؤجلة أو الملغاة لا نتيجة لها، والمباشرة والمنتهية تحتاج إلى نتيجة كاملة.', 'The score does not fit the match status. Scheduled, postponed and cancelled matches have no score; live and finished matches need both scores.'],
  'err.tz': ['المنطقة الزمنية غير صحيحة.', 'That time zone is not valid.'],
  'err.name': ['أدخل الاسم بالعربية أو بالإنجليزية على الأقل.', 'Enter the name in Arabic or English (at least one).'],
  'err.required': ['هذا الحقل مطلوب', 'This field is required'],
  'err.fileType': ['نوع الملف غير مدعوم. استخدم JPEG أو PNG أو WebP.', 'Unsupported file type. Use JPEG, PNG or WebP.'],
  'err.fileSize': ['حجم الملف كبير. الحد الأقصى {mb} ميجابايت.', 'The file is too large. Maximum is {mb} MB.'],
  'err.upload': ['فشل رفع الصورة: {msg}', 'Image upload failed: {msg}'],
  'err.auth': ['البريد الإلكتروني أو كلمة المرور غير صحيحة.', 'Wrong e-mail or password.'],
  'err.notAdmin': ['هذا الحساب غير مصرح له بدخول لوحة الإدارة.', 'This account is not authorised for the admin panel.'],
  /* ---- player positions ---- */
  'pos.GK': ['حارس مرمى', 'Goalkeeper'], 'pos.CB': ['مدافع قلب', 'Centre-back'], 'pos.LB': ['ظهير أيسر', 'Left-back'],
  'pos.RB': ['ظهير أيمن', 'Right-back'], 'pos.LWB': ['جناح مدافع أيسر', 'Left wing-back'], 'pos.RWB': ['جناح مدافع أيمن', 'Right wing-back'],
  'pos.CDM': ['لاعب ارتكاز', 'Defensive midfielder'], 'pos.CM': ['لاعب وسط', 'Central midfielder'], 'pos.CAM': ['صانع ألعاب', 'Attacking midfielder'],
  'pos.LM': ['وسط أيسر', 'Left midfielder'], 'pos.RM': ['وسط أيمن', 'Right midfielder'], 'pos.LW': ['جناح أيسر', 'Left winger'],
  'pos.RW': ['جناح أيمن', 'Right winger'], 'pos.CF': ['مهاجم متأخر', 'Second striker'], 'pos.ST': ['رأس حربة', 'Striker'],
  'foot.right': ['اليمنى', 'Right'], 'foot.left': ['اليسرى', 'Left'], 'foot.both': ['كلتاهما', 'Both'],
  /* ---- match statuses / results ---- */
  'status.scheduled': ['لم تبدأ', 'Scheduled'], 'status.live': ['مباشرة', 'Live'], 'status.completed': ['انتهت', 'Full time'],
  'status.postponed': ['مؤجلة', 'Postponed'], 'status.cancelled': ['ملغاة', 'Cancelled'], 'status.abandoned': ['توقفت', 'Abandoned'],
  'result.W': ['فوز', 'Win'], 'result.D': ['تعادل', 'Draw'], 'result.L': ['خسارة', 'Loss'],
  /* ---- public: home ---- */
  'home.players': ['لاعبو الفريق', 'The squad'], 'home.matches': ['المباريات', 'Fixtures and results'],
  'home.lineup': ['التشكيلة المعلنة', 'Announced lineup'], 'home.news': ['آخر الأخبار', 'Latest news'],
  'home.gallery': ['معرض الصور', 'Photo gallery'], 'home.about': ['عن النادي', 'About the club'],
  'home.upcoming': ['المباريات القادمة', 'Upcoming'], 'home.recent': ['آخر النتائج', 'Recent results'],
  'home.cta.players': ['اللاعبون', 'Players'], 'home.cta.matches': ['المباريات', 'Matches'], 'home.cta.lineup': ['التشكيلة', 'Lineup'],
  'empty.players': ['لا يوجد لاعبون مسجلون حاليًا.', 'No players are registered yet.'],
  'empty.playersFilter': ['لا يوجد لاعبون يطابقون البحث.', 'No players match your search.'],
  'empty.matches': ['لا توجد مباريات منشورة حاليًا.', 'No matches have been published yet.'],
  'empty.upcoming': ['لا توجد مباريات قادمة منشورة.', 'No upcoming matches are published.'],
  'empty.past': ['لا توجد نتائج سابقة منشورة.', 'No past results are published.'],
  'empty.lineup': ['لم يتم الإعلان عن التشكيلة بعد.', 'The lineup has not been announced yet.'],
  'empty.news': ['لا توجد أخبار منشورة حاليًا.', 'No news has been published yet.'],
  'empty.gallery': ['لا توجد صور منشورة حاليًا.', 'No photos have been published yet.'],
  'info.founded': ['تأسس', 'Founded'], 'info.stadium': ['الملعب', 'Stadium'], 'info.location': ['المدينة', 'Location'],
  'info.contact': ['التواصل', 'Contact'], 'info.email': ['البريد الإلكتروني', 'E-mail'], 'info.phone': ['الهاتف', 'Phone'],
  'info.address': ['العنوان', 'Address'], 'footer.links': ['روابط', 'Links'], 'footer.follow': ['تابعنا', 'Follow us'],
  'footer.rights': ['جميع الحقوق محفوظة.', 'All rights reserved.'],
  'social.facebook': ['فيسبوك', 'Facebook'], 'social.instagram': ['إنستغرام', 'Instagram'], 'social.x': ['إكس', 'X'],
  'social.youtube': ['يوتيوب', 'YouTube'], 'social.tiktok': ['تيك توك', 'TikTok'], 'social.website': ['الموقع', 'Website'],
  /* ---- public: players ---- */
  'players.title': ['لاعبو النادي', 'Club players'], 'players.search': ['ابحث بالاسم', 'Search by name'],
  'players.position': ['المركز', 'Position'], 'players.sort': ['الترتيب', 'Sort'],
  'players.sort.order': ['الترتيب الافتراضي', 'Default order'], 'players.sort.name': ['الاسم', 'Name'], 'players.sort.number': ['رقم القميص', 'Shirt number'],
  'player.number': ['الرقم', 'Number'], 'player.nationality': ['الجنسية', 'Nationality'], 'player.dob': ['تاريخ الميلاد', 'Date of birth'],
  'player.age': ['العمر', 'Age'], 'player.height': ['الطول', 'Height'], 'player.weight': ['الوزن', 'Weight'], 'player.foot': ['القدم المفضلة', 'Preferred foot'],
  'player.bio': ['نبذة', 'Biography'], 'player.noPhoto': ['لا توجد صورة', 'No photo'], 'player.captain': ['القائد', 'Captain'],
  /* ---- public: matches ---- */
  'matches.title': ['المباريات', 'Matches'], 'matches.upcoming': ['القادمة', 'Upcoming'], 'matches.past': ['النتائج السابقة', 'Past results'],
  'matches.competition': ['البطولة', 'Competition'], 'matches.season': ['الموسم', 'Season'],
  'match.venue': ['الملعب', 'Venue'], 'match.kickoff': ['موعد المباراة', 'Kick-off'], 'match.report': ['تقرير المباراة', 'Match report'],
  'match.details': ['تفاصيل المباراة', 'Match details'], 'match.vs': ['ضد', 'vs'], 'match.home': ['على أرضه', 'Home'], 'match.away': ['خارج أرضه', 'Away'],
  'match.lineup': ['تشكيلة المباراة', 'Match lineup'], 'match.viewLineup': ['عرض التشكيلة', 'View lineup'],
  'match.clubTimeNote': ['التوقيت حسب منطقة النادي الزمنية', 'Times shown in the club time zone'],
  /* ---- public: lineup ---- */
  'lineup.title': ['تشكيلة الفريق', 'Team lineup'], 'lineup.formation': ['الخطة', 'Formation'], 'lineup.starters': ['التشكيلة الأساسية', 'Starting XI'],
  'lineup.bench': ['البدلاء', 'Substitutes'], 'lineup.coach': ['المدرب', 'Coach'], 'lineup.notes': ['ملاحظات', 'Notes'],
  'lineup.choose': ['اختر المباراة', 'Choose a match'], 'lineup.attackDir': ['اتجاه الهجوم', 'Attacking direction'],
  'lineup.custom': ['توزيع مخصص', 'Custom layout'],
  /* ---- admin shell ---- */
  'admin.title': ['لوحة الإدارة', 'Admin panel'], 'admin.login': ['تسجيل الدخول', 'Sign in'], 'admin.logout': ['تسجيل الخروج', 'Sign out'],
  'admin.email': ['البريد الإلكتروني', 'E-mail'], 'admin.password': ['كلمة المرور', 'Password'], 'admin.signingIn': ['جارٍ الدخول…', 'Signing in…'],
  'admin.viewSite': ['عرض الموقع', 'View site'], 'admin.checking': ['جارٍ التحقق من الصلاحيات…', 'Checking access…'],
  'admin.nav.dashboard': ['لوحة المعلومات', 'Dashboard'], 'admin.nav.club': ['هوية النادي', 'Club identity'], 'admin.nav.players': ['اللاعبون', 'Players'],
  'admin.nav.competitions': ['البطولات', 'Competitions'], 'admin.nav.matches': ['المباريات', 'Matches'], 'admin.nav.lineups': ['منشئ التشكيلة', 'Lineup builder'],
  'admin.nav.news': ['الأخبار', 'News'], 'admin.nav.gallery': ['المعرض', 'Gallery'], 'admin.nav.settings': ['الإعدادات', 'Settings'],
  'admin.confirmDelete': ['هل أنت متأكد من الحذف؟ لا يمكن التراجع عن هذا الإجراء.', 'Delete this item? This cannot be undone.'],
  'admin.leave': ['لديك تعديلات غير محفوظة. هل تريد المغادرة؟', 'You have unsaved changes. Leave anyway?'],
  'admin.empty': ['لا توجد سجلات بعد. ابدأ بإضافة سجل جديد.', 'No records yet. Add the first one.'],
  'admin.new': ['جديد', 'New'], 'admin.saving': ['جارٍ الحفظ…', 'Saving…'], 'admin.published': ['تم النشر', 'Published'],
  'admin.hidden': ['تم الإخفاء', 'Hidden'], 'admin.order': ['الترتيب', 'Order'], 'admin.isPublished': ['منشور للزوار', 'Published to visitors'],
  'admin.isActive': ['نشط', 'Active'],
  /* ---- dashboard ---- */
  'dash.activePlayers': ['لاعبون نشطون', 'Active players'], 'dash.publishedPlayers': ['لاعبون منشورون', 'Published players'],
  'dash.upcoming': ['مباريات قادمة', 'Upcoming matches'], 'dash.completed': ['مباريات مكتملة', 'Completed matches'],
  'dash.drafts': ['تشكيلات مسودة', 'Draft lineups'], 'dash.publishedLineups': ['تشكيلات منشورة', 'Published lineups'],
  'dash.setup': ['ابدأ من هنا', 'Get started'], 'dash.setupHint': ['أضف هوية النادي واللاعبين والمباريات من القائمة الجانبية. لن تظهر أي بيانات للزوار قبل نشرها.', 'Add the club identity, players and matches from the sidebar. Nothing is visible to visitors until it is published.'],
  /* ---- uploader ---- */
  'img.choose': ['اختر صورة من جهازك', 'Choose an image'], 'img.drop': ['أو اسحب الصورة وأفلتها هنا', 'or drag and drop it here'],
  'img.replace': ['استبدال', 'Replace'], 'img.remove': ['إزالة الصورة', 'Remove image'], 'img.hint': ['JPEG أو PNG أو WebP، حتى {mb} ميجابايت', 'JPEG, PNG or WebP, up to {mb} MB'],
  'img.uploading': ['جارٍ رفع الصورة…', 'Uploading image…'], 'img.none': ['لا توجد صورة', 'No image'],
  /* ---- admin: club ---- */
  'club.names': ['الاسم', 'Name'], 'club.nameAr': ['اسم النادي بالعربية', 'Club name (Arabic)'], 'club.nameEn': ['اسم النادي بالإنجليزية', 'Club name (English)'],
  'club.sloganAr': ['الشعار النصي بالعربية', 'Slogan (Arabic)'], 'club.sloganEn': ['الشعار النصي بالإنجليزية', 'Slogan (English)'],
  'club.descAr': ['النبذة بالعربية', 'Description (Arabic)'], 'club.descEn': ['النبذة بالإنجليزية', 'Description (English)'],
  'club.logo': ['شعار النادي', 'Club logo'], 'club.cover': ['صورة الغلاف', 'Cover image'], 'club.founded': ['تاريخ التأسيس', 'Founding date'],
  'club.stadiumAr': ['الملعب بالعربية', 'Stadium (Arabic)'], 'club.stadiumEn': ['الملعب بالإنجليزية', 'Stadium (English)'],
  'club.cityAr': ['المدينة بالعربية', 'City (Arabic)'], 'club.cityEn': ['المدينة بالإنجليزية', 'City (English)'],
  'club.countryAr': ['الدولة بالعربية', 'Country (Arabic)'], 'club.countryEn': ['الدولة بالإنجليزية', 'Country (English)'],
  'club.email': ['البريد الإلكتروني', 'E-mail'], 'club.phone': ['الهاتف', 'Phone'], 'club.addressAr': ['العنوان بالعربية', 'Address (Arabic)'], 'club.addressEn': ['العنوان بالإنجليزية', 'Address (English)'],
  'club.social': ['روابط التواصل الاجتماعي', 'Social links'], 'club.socialHint': ['روابط كاملة تبدأ بـ https://', 'Full links starting with https://'],
  'club.colors': ['ألوان الموقع', 'Site colours'], 'club.colorHint': ['اترك اللون فارغًا لاستخدام اللون الافتراضي للتصميم.', 'Leave empty to use the design default.'],
  'club.colorPrimary': ['اللون الأساسي', 'Primary colour'], 'club.colorAccent': ['لون التمييز', 'Accent colour'], 'club.colorPitch': ['لون الملعب', 'Pitch colour'],
  'club.useDefault': ['استخدام الافتراضي', 'Use default'], 'club.identityHint': ['هذه البيانات تظهر في الصفحة الرئيسية. لا تُعرض إلا الحقول التي تملؤها.', 'These details appear on the home page. Only the fields you fill in are shown.'],
  /* ---- admin: settings ---- */
  'set.lang': ['اللغة الافتراضية للزوار', 'Default visitor language'], 'set.tz': ['المنطقة الزمنية للنادي', 'Club time zone'],
  'set.tzHint': ['مثال: Africa/Cairo أو Europe/London. تُعرض كل مواعيد المباريات بهذا التوقيت.', 'Example: Africa/Cairo or Europe/London. All match times are shown in this zone.'],
  'set.sections': ['أقسام الصفحة الرئيسية', 'Home page sections'], 'set.showPlayers': ['قسم اللاعبين', 'Players section'], 'set.showMatches': ['قسم المباريات', 'Matches section'],
  'set.showLineup': ['قسم التشكيلة', 'Lineup section'], 'set.showNews': ['قسم الأخبار', 'News section'], 'set.showGallery': ['قسم المعرض', 'Gallery section'],
  'set.display': ['إعدادات العرض', 'Display options'], 'set.homePlayers': ['عدد اللاعبين في الرئيسية', 'Players on the home page'],
  'set.homeMatches': ['عدد المباريات في كل قائمة بالرئيسية', 'Matches per list on the home page'], 'set.playersPage': ['عدد اللاعبين في الصفحة', 'Players per page'],
  'set.matchesPage': ['عدد المباريات في الصفحة', 'Matches per page'],
  /* ---- admin: players ---- */
  'ap.title': ['إدارة اللاعبين', 'Manage players'], 'ap.nameAr': ['الاسم بالعربية', 'Name (Arabic)'], 'ap.nameEn': ['الاسم بالإنجليزية', 'Name (English)'],
  'ap.jersey': ['رقم القميص', 'Shirt number'], 'ap.position': ['المركز', 'Position'], 'ap.natAr': ['الجنسية بالعربية', 'Nationality (Arabic)'], 'ap.natEn': ['الجنسية بالإنجليزية', 'Nationality (English)'],
  'ap.dob': ['تاريخ الميلاد', 'Date of birth'], 'ap.height': ['الطول (سم)', 'Height (cm)'], 'ap.weight': ['الوزن (كجم)', 'Weight (kg)'], 'ap.foot': ['القدم المفضلة', 'Preferred foot'],
  'ap.photo': ['صورة اللاعب', 'Player photo'], 'ap.bioAr': ['النبذة بالعربية', 'Biography (Arabic)'], 'ap.bioEn': ['النبذة بالإنجليزية', 'Biography (English)'],
  'ap.deleteHint': ['إن كان اللاعب موجودًا في تشكيلات سابقة فلن يُحذف؛ عطّله بدلًا من ذلك للحفاظ على السجل.', 'A player who appears in past lineups cannot be deleted; deactivate them instead to keep the history.'],
  'ap.name': ['الاسم', 'Name'], 'ap.status': ['الحالة', 'Status'], 'ap.unselected': ['— غير محدد —', '— Not set —'],
  /* ---- admin: competitions ---- */
  'ac.title': ['إدارة البطولات', 'Manage competitions'], 'ac.nameAr': ['اسم البطولة بالعربية', 'Name (Arabic)'], 'ac.nameEn': ['اسم البطولة بالإنجليزية', 'Name (English)'],
  /* ---- admin: matches ---- */
  'am.title': ['إدارة المباريات', 'Manage matches'], 'am.oppAr': ['اسم المنافس بالعربية', 'Opponent (Arabic)'], 'am.oppEn': ['اسم المنافس بالإنجليزية', 'Opponent (English)'],
  'am.oppLogo': ['شعار المنافس', 'Opponent logo'], 'am.side': ['يلعب النادي', 'The club plays'], 'am.date': ['تاريخ المباراة', 'Match date'], 'am.time': ['وقت الانطلاق', 'Kick-off time'],
  'am.tzNote': ['التاريخ والوقت بتوقيت النادي: {tz}', 'Date and time are in the club time zone: {tz}'],
  'am.competition': ['البطولة', 'Competition'], 'am.season': ['الموسم (مثال 2026/2027)', 'Season (e.g. 2026/2027)'], 'am.venueAr': ['الملعب بالعربية', 'Venue (Arabic)'], 'am.venueEn': ['الملعب بالإنجليزية', 'Venue (English)'],
  'am.status': ['الحالة', 'Status'], 'am.goalsClub': ['أهداف {club}', 'Goals: {club}'], 'am.goalsOpp': ['أهداف المنافس', 'Goals: opponent'],
  'am.reportAr': ['تقرير المباراة بالعربية', 'Match report (Arabic)'], 'am.reportEn': ['تقرير المباراة بالإنجليزية', 'Match report (English)'],
  'am.opponent': ['المنافس', 'Opponent'], 'am.when': ['الموعد', 'Date and time'], 'am.score': ['النتيجة', 'Score'], 'am.none': ['— بدون —', '— None —'],
  'am.dateRequired': ['التاريخ والوقت مطلوبان', 'Date and time are required'], 'am.scoreRule': ['تُدخل الأهداف فقط للمباريات المباشرة أو المنتهية أو الموقوفة.', 'Goals apply only to live, finished or abandoned matches.'],
  'am.scoreBoth': ['أدخل أهداف الفريقين معًا', 'Enter both teams\u2019 goals'],
  /* ---- admin: news / gallery ---- */
  'an.title': ['إدارة الأخبار', 'Manage news'], 'an.titleAr': ['العنوان بالعربية', 'Title (Arabic)'], 'an.titleEn': ['العنوان بالإنجليزية', 'Title (English)'],
  'an.bodyAr': ['المحتوى بالعربية', 'Content (Arabic)'], 'an.bodyEn': ['المحتوى بالإنجليزية', 'Content (English)'], 'an.cover': ['صورة الغلاف', 'Cover image'],
  'an.date': ['تاريخ النشر', 'Publish date'], 'an.time': ['وقت النشر', 'Publish time'], 'an.heading': ['العنوان', 'Title'],
  'ag.title': ['إدارة المعرض', 'Manage gallery'], 'ag.image': ['الصورة', 'Image'], 'ag.capAr': ['الوصف بالعربية', 'Caption (Arabic)'], 'ag.capEn': ['الوصف بالإنجليزية', 'Caption (English)'],
  'ag.imageRequired': ['اختر صورة للمعرض', 'Choose an image for the gallery'],
  /* ---- lineup builder ---- */
  'lb.title': ['منشئ التشكيلة', 'Lineup builder'], 'lb.match': ['المباراة', 'Match'], 'lb.chooseMatch': ['اختر مباراة…', 'Choose a match…'],
  'lb.formation': ['الخطة', 'Formation'], 'lb.coachAr': ['المدرب بالعربية', 'Coach (Arabic)'], 'lb.coachEn': ['المدرب بالإنجليزية', 'Coach (English)'],
  'lb.notesAr': ['ملاحظات بالعربية', 'Notes (Arabic)'], 'lb.notesEn': ['ملاحظات بالإنجليزية', 'Notes (English)'],
  'lb.available': ['اللاعبون المتاحون', 'Available players'], 'lb.searchPlayers': ['ابحث عن لاعب', 'Search players'],
  'lb.toPitch': ['إلى الملعب', 'To pitch'], 'lb.toBench': ['إلى البدلاء', 'To bench'], 'lb.bench': ['البدلاء', 'Substitutes'],
  'lb.starters': ['الأساسيون', 'Starters'], 'lb.selected': ['اللاعب المحدد', 'Selected player'], 'lb.noSelection': ['اختر لاعبًا على الملعب أو من البدلاء لتعديله.', 'Select a player on the pitch or bench to edit them.'],
  'lb.posX': ['الموضع الأفقي', 'Horizontal position'], 'lb.posY': ['الموضع الرأسي', 'Vertical position'], 'lb.posLabel': ['مركز اللاعب في التشكيلة', 'Role in the lineup'],
  'lb.captain': ['قائد الفريق', 'Team captain'], 'lb.replace': ['استبدال بلاعب آخر', 'Replace with another player'], 'lb.replacePick': ['— اختر البديل —', '— Choose replacement —'],
  'lb.remove': ['إزالة من التشكيلة', 'Remove from lineup'], 'lb.moveBench': ['نقل إلى البدلاء', 'Move to bench'], 'lb.moveStarter': ['نقل إلى الأساسيين', 'Move to starters'],
  'lb.up': ['أعلى', 'Move up'], 'lb.down': ['أسفل', 'Move down'], 'lb.nudge': ['تحريك', 'Nudge'],
  'lb.saveDraft': ['حفظ المسودة', 'Save draft'], 'lb.preview': ['معاينة', 'Preview'], 'lb.publish': ['نشر التشكيلة', 'Publish lineup'],
  'lb.unpublish': ['إلغاء النشر', 'Unpublish'], 'lb.discard': ['حذف المسودة', 'Discard draft'], 'lb.deleteLineup': ['حذف التشكيلة', 'Delete lineup'],
  'lb.state.new': ['تشكيلة جديدة (لم تُحفظ)', 'New lineup (not saved yet)'], 'lb.state.draft': ['مسودة', 'Draft'],
  'lb.state.published': ['منشورة', 'Published'], 'lb.state.publishedWithDraft': ['منشورة، وتوجد مسودة معدلة', 'Published, with an edited draft'],
  'lb.publishedReadonly': ['هذه التشكيلة منشورة. عدّل نسخة مسودة منها؛ تبقى المنشورة ظاهرة للزوار حتى تنشر المسودة.', 'This lineup is published. Edit a draft copy; the published one stays visible to visitors until you publish the draft.'],
  'lb.makeDraft': ['إنشاء مسودة للتعديل', 'Create a draft to edit'], 'lb.counts': ['{s}/11 أساسيون، {b} بدلاء', '{s}/11 starters, {b} substitutes'],
  'lb.dirty': ['تعديلات غير محفوظة', 'Unsaved changes'], 'lb.clean': ['كل التعديلات محفوظة', 'All changes saved'],
  'lb.saveFirst': ['احفظ المسودة قبل النشر', 'Save the draft before publishing'],
  'lb.confirmFormation': ['سيتم إعادة توزيع الأساسيين حسب الخطة الجديدة. هل تريد المتابعة؟', 'Starters will be re-arranged to the new formation. Continue?'],
  'lb.confirmPublish': ['نشر هذه التشكيلة للزوار؟', 'Publish this lineup to visitors?'], 'lb.confirmUnpublish': ['إلغاء نشر التشكيلة وإعادتها إلى مسودة؟', 'Unpublish this lineup and turn it back into a draft?'],
  'lb.confirmDiscard': ['حذف المسودة نهائيًا؟ النسخة المنشورة (إن وجدت) لن تتأثر.', 'Discard this draft permanently? Any published version stays as it is.'],
  'lb.confirmDeleteLineup': ['حذف التشكيلة نهائيًا؟', 'Delete this lineup permanently?'],
  'lb.pitchFull': ['اكتمل عدد الأساسيين (11). انقل لاعبًا إلى البدلاء أولًا.', 'The starting XI is full (11). Move a player to the bench first.'],
  'lb.dragHint': ['اسحب اللاعب على الملعب لتحريكه، أو اخترْه واستخدم أزرار التحكم.', 'Drag a player on the pitch to move them, or select them and use the controls.'],
  'lb.noPlayers': ['لا يوجد لاعبون نشطون. أضف لاعبين أولًا من صفحة اللاعبين.', 'There are no active players. Add players first from the Players page.'],
  'lb.noMatches': ['لا توجد مباريات. أنشئ مباراة أولًا من صفحة المباريات.', 'There are no matches. Create a match first from the Matches page.'],
  'lb.draftSaved': ['تم حفظ المسودة', 'Draft saved'], 'lb.unpublished': ['تم إلغاء النشر', 'Lineup unpublished'],
  'lb.previewTitle': ['معاينة التشكيلة العامة', 'Public lineup preview'], 'lb.previewNote': ['هكذا ستظهر التشكيلة للزوار بعد النشر.', 'This is how visitors will see the lineup once published.'],
  'lb.inactiveNote': ['غير نشط', 'Inactive'], 'lb.onPitch': ['على الملعب', 'On pitch'], 'lb.onBench': ['على الدكة', 'On bench'], 'lb.allUsed': ['جميع اللاعبين مضافون', 'All players are in the lineup'],
  'lb.unpublishedPlayerWarn': ['تنبيه: بعض اللاعبين غير منشورين، لذلك قد لا تظهر بياناتهم للزوار.', 'Note: some players are not published, so their details may not be visible to visitors.']
};

const KEYS = Object.keys(D);
const LS = 'pavo_lang';
let lang = 'ar';
const listeners = new Set();

export const getLang = () => lang;
export const dir = () => (lang === 'ar' ? 'rtl' : 'ltr');
export function t(key, vars = {}) {
  const e = D[key];
  if (!e) { console.warn('[i18n] missing key:', key); return key; }
  return e[lang === 'ar' ? 0 : 1].replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
}
export const hasKey = (k) => k in D;
export const allKeys = () => KEYS;

/** Apply to static markup:  data-i18n="key"  data-i18n-placeholder / -aria-label / -title */
export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  for (const attr of ['placeholder', 'aria-label', 'title']) {
    root.querySelectorAll(`[data-i18n-${attr}]`).forEach((el) => el.setAttribute(attr, t(el.getAttribute(`data-i18n-${attr}`))));
  }
}
function applyDocument() {
  document.documentElement.lang = lang;
  document.documentElement.dir = dir();
  applyI18n();
}

/** Choose the starting language: saved choice > club default > Arabic. */
export function initLang(clubDefault) {
  let saved = null; try { saved = localStorage.getItem(LS); } catch { /* storage may be blocked */ }
  lang = saved === 'en' || saved === 'ar' ? saved : (clubDefault === 'en' ? 'en' : 'ar');
  applyDocument();
}
export function setLang(next) {
  if (next !== 'ar' && next !== 'en') return;
  lang = next;
  try { localStorage.setItem(LS, next); } catch { /* ignore */ }
  applyDocument();
  listeners.forEach((fn) => fn(lang));
}
export const toggleLang = () => setLang(lang === 'ar' ? 'en' : 'ar');
export function onLangChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

/** Convenience for enum labels. */
export const posLabel = (p) => (p ? t(`pos.${p}`) : '');
export const POSITIONS = ['GK','CB','LB','RB','LWB','RWB','CDM','CM','CAM','LM','RM','LW','RW','CF','ST'];
export const STATUSES = ['scheduled','live','completed','postponed','cancelled','abandoned'];
