// Admin building blocks: confirm dialog, form builder, image uploader field, dirty-state tracking.
import { imageUrl } from '../supabase.js';
import { t } from '../i18n.js';
import { esc, $, $$, toast } from '../utils.js';
import { validateImage, MAX_UPLOAD_MB } from '../api.js';

/* ---------------------------- dirty state ---------------------------- */
let dirty = false;
export const isDirty = () => dirty;
export const setDirty = (v) => { dirty = !!v; document.dispatchEvent(new CustomEvent('dirtychange', { detail: dirty })); };
window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

/* ---------------------------- dialogs ---------------------------- */
export function confirmDialog(message, { danger = false, okLabel } = {}) {
  return new Promise((resolve) => {
    const d = document.createElement('dialog');
    d.className = 'confirm';
    d.innerHTML = `<form method="dialog"><p>${esc(message)}</p><div class="dlg-actions">
      <button class="btn" value="cancel">${esc(t('common.cancel'))}</button>
      <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" value="ok">${esc(okLabel || t('common.confirm'))}</button></div></form>`;
    document.body.append(d);
    d.addEventListener('close', () => { const ok = d.returnValue === 'ok'; d.remove(); resolve(ok); });
    d.showModal();
  });
}

/** Modal that hosts a form. Returns {dialog, body, close}. */
export function openModal(title, html, { wide = false } = {}) {
  const d = document.createElement('dialog');
  d.className = `modal${wide ? ' modal-wide' : ''}`;
  d.innerHTML = `<div class="modal-head"><h2>${esc(title)}</h2><button type="button" class="dlg-x" data-close aria-label="${esc(t('common.close'))}">×</button></div><div class="modal-body">${html}</div>`;
  document.body.append(d);
  const close = () => { d.close(); };
  d.addEventListener('close', () => d.remove());
  d.querySelector('[data-close]').addEventListener('click', close);
  d.showModal();
  return { dialog: d, body: d.querySelector('.modal-body'), close };
}

/* ---------------------------- form builder ---------------------------- */
/* field: {name, type, label(i18n key), required, options, min, max, step, maxlength, span, hint, bucket, folder, rows, defaultColor}
   types: text | textarea | number | select | checkbox | date | time | email | url | tel | color | image */
const dirFor = (name) => (/_ar$/.test(name) ? 'rtl' : /_en$/.test(name) ? 'ltr' : 'auto');

export function fieldHtml(f, value) {
  const id = `f_${f.name}`;
  const label = `<span>${esc(t(f.label))}${f.required ? ' *' : ''}</span>`;
  const hint = f.hint ? `<small class="hint">${esc(typeof f.hint === 'function' ? f.hint() : t(f.hint))}</small>` : '';
  const span = f.span === 2 ? ' span-2' : '';
  const v = value ?? '';
  const common = `id="${id}" name="${esc(f.name)}" ${f.required ? 'required' : ''}`;
  switch (f.type) {
    case 'textarea':
      return `<label class="field${span}">${label}<textarea ${common} dir="${dirFor(f.name)}" rows="${f.rows || 4}" maxlength="${f.maxlength || 8000}">${esc(v)}</textarea>${hint}</label>`;
    case 'select':
      return `<label class="field${span}">${label}<select ${common}>${(f.options || []).map((o) => `<option value="${esc(o.value)}" ${String(o.value) === String(v) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>${hint}</label>`;
    case 'checkbox':
      return `<label class="check${span}"><input type="checkbox" ${common} ${v === true || v === 'true' ? 'checked' : ''}><span>${esc(t(f.label))}</span></label>`;
    case 'color': {
      const isDefault = !v;
      return `<div class="field${span}" data-color="${esc(f.name)}"><span>${esc(t(f.label))}</span><div class="color-row">
        <input type="color" id="${id}" value="${esc(v || f.defaultColor || '#0e5a63')}" ${isDefault ? 'disabled' : ''} aria-label="${esc(t(f.label))}">
        <label class="check"><input type="checkbox" data-default ${isDefault ? 'checked' : ''}><span>${esc(t('club.useDefault'))}</span></label></div></div>`;
    }
    case 'image':
      return `<div class="field imgfield${span}" data-image="${esc(f.name)}"><span>${esc(t(f.label))}${f.required ? ' *' : ''}</span>
        <div class="img-preview" aria-live="polite"></div>
        <div class="img-drop" tabindex="0" role="button"><b>${esc(t('img.choose'))}</b><small>${esc(t('img.drop'))}</small><small>${esc(t('img.hint', { mb: MAX_UPLOAD_MB }))}</small></div>
        <input type="file" accept="image/jpeg,image/png,image/webp" hidden>
        <button type="button" class="btn btn-sm" data-remove hidden>${esc(t('img.remove'))}</button></div>`;
    default: {
      const attrs = [f.min != null ? `min="${f.min}"` : '', f.max != null ? `max="${f.max}"` : '', f.step ? `step="${f.step}"` : '', f.maxlength ? `maxlength="${f.maxlength}"` : '', f.pattern ? `pattern="${f.pattern}"` : ''].join(' ');
      return `<label class="field${span}">${label}<input type="${f.type || 'text'}" ${common} ${attrs} value="${esc(v)}" dir="${f.type === 'number' || ['date', 'time', 'email', 'url', 'tel'].includes(f.type) ? 'ltr' : dirFor(f.name)}">${hint}</label>`;
    }
  }
}

/** Build the form HTML and attach image-field behaviour. Returns the <form> element. */
export function buildForm(fields, values, { bucketsRoot } = {}) {
  const form = document.createElement('form');
  form.className = 'form-grid'; form.noValidate = false;
  form.innerHTML = fields.map((f) => (f.heading ? `<h3 class="form-heading span-2">${esc(t(f.heading))}</h3>` : fieldHtml(f, values[f.name]))).join('');
  form._imgs = {};
  for (const f of fields.filter((x) => x.type === 'image')) {
    const root = form.querySelector(`[data-image="${f.name}"]`);
    form._imgs[f.name] = mountImageField(root, f, values[f.name] || null);
  }
  for (const c of form.querySelectorAll('[data-color]')) {
    const box = c.querySelector('input[type=color]'), def = c.querySelector('[data-default]');
    def.addEventListener('change', () => { box.disabled = def.checked; });
  }
  return form;
}

function mountImageField(root, f, currentPath) {
  const state = { current: currentPath, file: null, removed: false, objectUrl: '' };
  const prev = $('.img-preview', root), drop = $('.img-drop', root), input = $('input[type=file]', root), rm = $('[data-remove]', root);
  const draw = () => {
    const src = state.file ? state.objectUrl : (!state.removed && state.current ? imageUrl(f.bucket, state.current) : '');
    prev.innerHTML = src ? `<img src="${esc(src)}" alt="">` : `<span class="img-none">${esc(t('img.none'))}</span>`;
    rm.hidden = !src;
  };
  const choose = (file) => {
    if (!file) return;
    try { validateImage(file); } catch (e) { toast(e.message, 'error'); return; }
    if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
    state.file = file; state.removed = false; state.objectUrl = URL.createObjectURL(file); draw();   // blob URL is for the preview ONLY
  };
  drop.addEventListener('click', () => input.click());
  drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
  input.addEventListener('change', () => { choose(input.files[0]); input.value = ''; });
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', (e) => choose(e.dataTransfer.files[0]));
  rm.addEventListener('click', () => { if (state.objectUrl) URL.revokeObjectURL(state.objectUrl); state.file = null; state.objectUrl = ''; state.removed = true; draw(); });
  draw();
  return state;
}

/** Read plain values out of a built form (images are handled separately via form._imgs). */
export function readForm(form, fields) {
  const out = {};
  for (const f of fields) {
    if (f.heading || f.type === 'image') continue;
    if (f.type === 'checkbox') { out[f.name] = form.elements[f.name].checked; continue; }
    if (f.type === 'color') {
      const box = form.querySelector(`[data-color="${f.name}"]`);
      out[f.name] = box.querySelector('[data-default]').checked ? null : box.querySelector('input[type=color]').value; continue;
    }
    const raw = form.elements[f.name].value;
    if (f.type === 'number') out[f.name] = raw === '' ? null : Number(raw);
    else if (f.type === 'select') out[f.name] = raw === '' ? null : raw;
    else out[f.name] = String(raw).trim() === '' ? null : String(raw).trim();
  }
  return out;
}

/** Run an async action with a disabled/"saving" submit button (prevents double submits). */
export async function withBusy(btn, fn) {
  if (btn.dataset.busy) return;
  btn.dataset.busy = '1'; const label = btn.textContent; btn.disabled = true; btn.textContent = t('admin.saving');
  try { return await fn(); } finally { delete btn.dataset.busy; btn.disabled = false; btn.textContent = label; }
}
export { $, $$ };
