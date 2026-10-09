import { bootAdmin } from './shell.js';
import { mountCrud, thumb, flag } from './crud.js';
import { adminAll } from '../api.js';
import { BUCKETS } from '../supabase.js';
import { t, STATUSES } from '../i18n.js';
import { esc, pick, fmtDate, fmtTime, utcToZonedInputs, zonedToUtcIso, clubScore, opponentScore } from '../utils.js';
import { statusBadge } from '../ui.js';

const WITH_SCORE = ['live', 'completed', 'abandoned'];
const clubLabel = (s) => s.name_en || s.name_ar || 'PAVO CLUB';

bootAdmin({ page: 'matches', title: 'admin.nav.matches', render: (ctx) => {
  const tz = ctx.settings.timezone || 'UTC';
  return mountCrud(ctx, {
    table: 'matches', select: '*, competition:competitions(id,name_ar,name_en)', searchCols: ['opponent_ar', 'opponent_en', 'season'],
    order: [{ col: 'kickoff_at', asc: false }], pageSize: 15,
    loadOptions: async () => ({ comps: await adminAll('competitions', { order: [{ col: 'display_order' }, { col: 'name_en' }] }) }),
    newDefaults: { club_is_home: 'true', status: 'scheduled', is_published: false },
    toggles: [{ field: 'is_published', on: 'common.published', off: 'common.hidden' }],
    fields: ({ extra, settings }) => [
      { name: 'opponent_ar', type: 'text', label: 'am.oppAr' }, { name: 'opponent_en', type: 'text', label: 'am.oppEn' },
      { name: 'opponent_logo', type: 'image', label: 'am.oppLogo', bucket: BUCKETS.club, folder: 'opponents', span: 2 },
      { name: 'club_is_home', type: 'select', label: 'am.side', options: [{ value: 'true', label: t('match.home') }, { value: 'false', label: t('match.away') }] },
      { name: 'competition_id', type: 'select', label: 'am.competition', options: [{ value: '', label: t('am.none') }, ...extra.comps.map((c) => ({ value: c.id, label: pick(c, 'name', ctx.lang) }))] },
      { name: 'match_date', type: 'date', label: 'am.date', required: true }, { name: 'match_time', type: 'time', label: 'am.time', required: true,
        hint: () => t('am.tzNote', { tz }) },
      { name: 'season', type: 'text', label: 'am.season', maxlength: 20 },
      { name: 'venue_ar', type: 'text', label: 'am.venueAr' }, { name: 'venue_en', type: 'text', label: 'am.venueEn' },
      { name: 'status', type: 'select', label: 'am.status', options: STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) })), hint: 'am.scoreRule' },
      { name: 'goals_club', type: 'number', label: 'am.goalsClub', min: 0, max: 99, step: 1 },
      { name: 'goals_opp', type: 'number', label: 'am.goalsOpp', min: 0, max: 99, step: 1 },
      { name: 'match_report_ar', type: 'textarea', label: 'am.reportAr', span: 2 }, { name: 'match_report_en', type: 'textarea', label: 'am.reportEn', span: 2 },
      { name: 'is_published', type: 'checkbox', label: 'admin.isPublished' }
    ].map((f) => (f.name === 'goals_club' ? { ...f, label: 'am.goalsClub' } : f)),
    toForm: (r) => {
      const z = utcToZonedInputs(r.kickoff_at, tz);
      return { ...r, club_is_home: String(r.club_is_home), competition_id: r.competition_id || '', match_date: z.date, match_time: z.time,
        goals_club: r.home_score == null ? '' : clubScore(r), goals_opp: r.home_score == null ? '' : opponentScore(r) };
    },
    validate: (v) => {
      if (!v.opponent_ar && !v.opponent_en) return t('err.name');
      if (!v.match_date || !v.match_time) return t('am.dateRequired');
      const has = (x) => x != null;
      if (WITH_SCORE.includes(v.status) && !(has(v.goals_club) && has(v.goals_opp))) return t('am.scoreBoth');
      return null;
    },
    toPayload: (v) => {
      const { match_date, match_time, goals_club, goals_opp, ...rest } = v;
      const home = v.club_is_home === 'true', scored = WITH_SCORE.includes(v.status);
      return { ...rest, club_is_home: home, kickoff_at: zonedToUtcIso(match_date, match_time, tz),   // typed in the club zone, stored as UTC
        home_score: scored ? (home ? goals_club : goals_opp) : null, away_score: scored ? (home ? goals_opp : goals_club) : null };
    },
    columns: [
      { label: 'am.when', render: (r) => `${esc(fmtDate(r.kickoff_at, ctx.lang, tz, { day: 'numeric', month: 'short', year: 'numeric' }))}<br><small>${esc(fmtTime(r.kickoff_at, ctx.lang, tz))}</small>` },
      { label: 'am.opponent', render: (r) => `${thumb(BUCKETS.club, r.opponent_logo)} ${esc(pick(r, 'opponent', ctx.lang))} <small>(${esc(t(r.club_is_home ? 'match.home' : 'match.away'))})</small>` },
      { label: 'am.status', render: (r) => statusBadge(r.status) },
      { label: 'am.score', render: (r) => (r.home_score == null ? '–' : `<bdi>${esc(clubLabel(ctx.settings))}</bdi> ${esc(clubScore(r))} : ${esc(opponentScore(r))}`) },
      { label: 'ap.status', render: (r) => flag(r.is_published, 'common.published', 'common.hidden') }
    ]
  });
} });
