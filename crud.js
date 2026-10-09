// Generic admin list + create/edit/delete page, driven by a config object.
import { adminList, adminSave, adminDelete, uploadImage, removeImage, friendlyError } from '../api.js';
import { imageUrl } from '../supabase.js';
import { t, onLangChange } from '../i18n.js';
import { $, esc, debounce, toast, loadingHtml, emptyHtml, errorHtml } from '../utils.js';
import { buildForm, readForm, openModal, confirmDialog, withBusy } from './ui.js';
import { paginationHtml } from '../ui.js';

/* cfg: {table, select, order, searchCols, pageSize, columns:[{label,render(row,ctx)}], fields(ctx)->[], toForm?(row,ctx), toPayload?(values,ctx,row),
         validate?(values,ctx), toggles:[{field,on,off}], titleKey, deleteHint, newDefaults, loadOptions?(ctx) } */
export async function mountCrud(ctx, cfg) {
  const { main } = ctx;
  const state = { page: 1, search: '' };
  const size = cfg.pageSize || 15;
  let extra = {};
  if (cfg.loadOptions) { try { extra = await cfg.loadOptions(ctx); } catch (e) { toast(friendlyError(e), 'error'); } }
  const fieldsFor = () => cfg.fields({ ...ctx, extra });

  main.innerHTML = `<div class="toolbar">${cfg.searchCols ? `<input id="q" type="search" placeholder="${esc(t('common.search'))}" aria-label="${esc(t('common.search'))}">` : '<span></span>'}
    <button class="btn btn-primary" id="new" type="button">${esc(t('common.add'))}</button></div>
    ${cfg.deleteHint ? `<p class="note">${esc(t(cfg.deleteHint))}</p>` : ''}<div id="list" aria-live="polite"></div><div id="pager"></div>`;
  const list = $('#list'), pager = $('#pager');

  async function load() {
    list.innerHTML = loadingHtml();
    try {
      const { rows, count } = await adminList(cfg.table, { select: cfg.select || '*', order: cfg.order || [], page: state.page, pageSize: size,
        search: cfg.searchCols ? { cols: cfg.searchCols, text: state.search } : null });
      if (!rows.length && state.page > 1) { state.page = 1; return load(); }
      if (!rows.length) { list.innerHTML = emptyHtml(t('admin.empty')); pager.innerHTML = ''; return; }
      list.innerHTML = `<div class="table-wrap"><table class="tbl"><thead><tr>${cfg.columns.map((c) => `<th>${esc(t(c.label))}</th>`).join('')}<th>${esc(t('common.actions'))}</th></tr></thead>
        <tbody>${rows.map((r) => `<tr data-id="${esc(r.id)}">${cfg.columns.map((c) => `<td data-label="${esc(t(c.label))}">${c.render(r, ctx)}</td>`).join('')}
        <td class="row-actions">${(cfg.toggles || []).map((g) => `<button class="btn btn-sm" type="button" data-toggle="${g.field}">${esc(r[g.field] ? t(g.off) : t(g.on))}</button>`).join('')}
          <button class="btn btn-sm" type="button" data-edit>${esc(t('common.edit'))}</button><button class="btn btn-sm btn-danger" type="button" data-del>${esc(t('common.delete'))}</button></td></tr>`).join('')}</tbody></table></div>`;
      pager.innerHTML = paginationHtml(state.page, count, size);
      pager.querySelectorAll('[data-page]').forEach((b) => b.addEventListener('click', () => { state.page = +b.dataset.page; load(); }));
      const byId = new Map(rows.map((r) => [r.id, r]));
      list.querySelectorAll('tr[data-id]').forEach((tr) => {
        const row = byId.get(tr.dataset.id);
        tr.querySelector('[data-edit]').addEventListener('click', () => edit(row));
        tr.querySelector('[data-del]').addEventListener('click', () => remove(row));
        tr.querySelectorAll('[data-toggle]').forEach((b) => b.addEventListener('click', () => withBusy(b, async () => {
          const g = cfg.toggles.find((x) => x.field === b.dataset.toggle);
          try { await adminSave(cfg.table, row.id, { [g.field]: !row[g.field] }); toast(!row[g.field] ? t('admin.published') : t('admin.hidden')); await load(); }
          catch (e) { toast(friendlyError(e), 'error'); }
        })));
      });
    } catch (e) { list.innerHTML = errorHtml(friendlyError(e), t('common.retry')); list.querySelector('[data-retry]').onclick = load; }
  }

  function edit(row) {
    const fields = fieldsFor();
    const values = row ? (cfg.toForm ? cfg.toForm(row, ctx) : { ...row }) : { ...(cfg.newDefaults || {}) };
    const form = buildForm(fields, values);
    const m = openModal(t(row ? 'common.edit' : 'common.add'), '', { wide: true });
    m.body.append(form);
    form.insertAdjacentHTML('beforeend', `<div class="dlg-actions span-2"><button type="button" class="btn" data-cancel>${esc(t('common.cancel'))}</button><button type="submit" class="btn btn-primary">${esc(t('common.save'))}</button></div>`);
    form.querySelector('[data-cancel]').addEventListener('click', m.close);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      withBusy(form.querySelector('[type=submit]'), async () => {
        const uploaded = [], oldPaths = [];
        try {
          const v = readForm(form, fields);
          const err = cfg.validate?.(v, ctx, form); if (err) { toast(err, 'error'); return; }
          const imgCols = {};
          for (const f of fields.filter((x) => x.type === 'image')) {
            const st = form._imgs[f.name];
            if (st.file) { const p = await uploadImage(f.bucket, f.folder, st.file); uploaded.push([f.bucket, p]); imgCols[f.name] = p; if (st.current) oldPaths.push([f.bucket, st.current]); }
            else if (st.removed) { imgCols[f.name] = null; if (st.current) oldPaths.push([f.bucket, st.current]); }
            if (f.required && !(imgCols[f.name] ?? (st.removed ? null : st.current))) { toast(t(cfg.imageRequiredKey || 'err.required'), 'error'); await Promise.all(uploaded.map(([b, p]) => removeImage(b, p))); return; }
          }
          const payload = { ...(cfg.toPayload ? cfg.toPayload(v, ctx, row) : v), ...imgCols };
          try { await adminSave(cfg.table, row?.id, payload); }
          catch (e) { await Promise.all(uploaded.map(([b, p]) => removeImage(b, p))); throw e; }   // no orphan files if the row failed
          await Promise.all(oldPaths.map(([b, p]) => removeImage(b, p)));                        // old file removed only after success
          toast(t('common.saved')); m.close(); await load();
        } catch (e) { toast(friendlyError(e), 'error'); }
      });
    });
  }

  async function remove(row) {
    if (!(await confirmDialog(t('admin.confirmDelete'), { danger: true, okLabel: t('common.delete') }))) return;
    try {
      await adminDelete(cfg.table, row.id);
      for (const f of fieldsFor().filter((x) => x.type === 'image')) await removeImage(f.bucket, row[f.name]);
      toast(t('common.deleted')); await load();
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  $('#new').addEventListener('click', () => edit(null));
  $('#q')?.addEventListener('input', debounce((e) => { state.search = e.target.value; state.page = 1; load(); }, 350));
  await load();
}
export const thumb = (bucket, path, cls = 'thumb') => path ? `<img class="${cls}" src="${esc(imageUrl(bucket, path))}" alt="" loading="lazy">` : '<span class="thumb thumb-none">–</span>';
export const flag = (on, yes, no) => `<span class="badge ${on ? 'res-W' : ''}">${esc(t(on ? yes : no))}</span>`;
