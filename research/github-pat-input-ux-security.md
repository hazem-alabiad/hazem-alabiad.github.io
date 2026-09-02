# GitHub PAT input — UX + security (primary-source research)

**Question:** How should a web app that takes a GitHub Personal Access Token (PAT) — this app's blog/CMS unlock — design and secure the input?

**Scope:** input semantics (autocomplete / password behavior), labels, spellcheck, and client-side storage of the token.

**Sources (primary):**
- WHATWG HTML Standard — *Autofilling form controls: the autocomplete attribute*
  `https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill`
- MDN — *autocomplete HTML attribute* (`https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete`)
- MDN — *How to turn off form autocompletion* (`https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Turning_off_form_autocompletion`)
- MDN — *spellcheck global attribute* (`https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/spellcheck`)
- GitHub Docs — *Managing your personal access tokens* (`https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens`)
- GitHub Docs — *Keeping your API credentials secure* (`https://docs.github.com/en/rest/authentication/keeping-your-api-credentials-secure`)
- OWASP Cheat Sheet Series — *HTML5 Security* (`https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html`)

---

## 1. Input type and autocomplete

`type="password"` is right (this app already uses it) — the token never echoes.

**Which autocomplete value?** A PAT is a *new credential you are entering once*, not the site's own password: the field is a `password`-typed input, and every primary source warns that plain `autocomplete="off"` is unreliable on password inputs:

- WHATWG spec: `off` means the browser "is not permitted to automatically enter or select a value for this field"; whether a UA has to honor it for password fields varies — the spec ties `off` to fields where "security concerns require that the field's value not be automatically entered" ([source](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill)).
- MDN (turning-off guide): "many modern browsers do not support `autocomplete="off"` for login fields — the browser will still offer to remember this login / autofill those fields" ([source](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Turning_off_form_autocompletion)).
- MDN (attribute reference): `new-password` is for when the field holds a credential the user is entering for the first time, and the browser "may use" it "both to avoid accidentally filling in an existing password and to offer assistance in creating a secure password" ([source](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete)).

**Recommendation:** `autocomplete="new-password"` on the PAT input. It correctly models "a credential to remember for this app", stops existing-password autofill, and gives the password manager the right hook — while `autocomplete="off"` would be both unreliable (ignored on password fields by major browsers) and harmful (breaks autofill for users who legitimately want their secret stored by their own manager). MDN's only legitimate `off` use-case is "CAPTCHA or one-time token fields" — a PAT is not one-time per session.

**Do not invent values** (e.g. `autocomplete="nope"`): MDN explicitly flags invalid/made-up tokens as both ineffective and a WCAG failure ([source](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete)).

## 2. Labeling + WCAG

- Visible, programmatically-associated label required: WCAG 2.1 / WCAG 2.2 *1.3.5 Identify Input Purpose* (Level AA) can only be satisfied with a *valid* autocomplete token; a label must exist either way (WCAG *3.3.2 Labels or Instructions*). MDN's accessibility section: appropriate autocomplete values satisfy 1.3.5 and help users with cognitive/motor disabilities ([source](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete#accessibility)).
- Current defects this maps to: `BlogAdmin.tsx` PAT input and `PostEditor.tsx` PAT input are placeholder-only (`placeholder="GitHub PAT"`) with no `<label>`/`aria-label`; `CMSButton.tsx` unlock input same.
- Because the fields sit in a password-style context, placeholders are the worst possible labeling: browsers may classify the form as a login and the WCAG input-purpose check fails.

**Recommendation:** `<label htmlFor>` "GitHub PAT" (or `aria-label`) on each PAT input; keep `placeholder` for a format hint only ("`ghp_…` / `github_pat_…`").

## 3. Spellcheck / autocorrect / autocapitalize

- MDN spellcheck: "the content of the element may be sent to a third party for spellchecking results (see *enhanced spellchecking* and *spell-jacking*). You should consider setting `spellcheck` to false for elements that can contain sensitive information." ([source](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/spellcheck))
- OWASP *Credential and PII input hints*: protect input values from being cached by the browser ([source](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#credential-and-personally-identifiable-information-pii-input-hints)).

**Recommendation:** `spellCheck={false}` — plus, defensively, `autoComplete="new-password"` (not `off`, per §1) and `autoCapitalize="off"` / `autoCorrect="off"` (React props) on all three PAT inputs. Re-submitting the value through the spellchecker (or iOS keyboard autocorrect) is a real leak vector for a secret.

## 4. Storing the token client-side

Current behavior: `saveBlogSession`/`loadBlogSession` (`src/blog/editor.tsx`) persist `hazem-blog-token` **plaintext in localStorage**; `clearBlogSession` + RESUME re-verify. Primary-source verdict:

- OWASP HTML5 Security Cheat Sheet, local storage: "**Do not store session identifiers in local storage** as the data is always accessible by JavaScript… a single Cross Site Scripting can be used to steal all the data in these objects"; also "any authentication your application requires can be bypassed by a user with local privileges to the machine"; "**Use the object sessionStorage instead of localStorage if persistent storage is not needed**" ([source](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#storage-apis)).
- GitHub Docs: "**Treat authentication credentials the same way you would treat your passwords**", "Don't pass your personal access token as plain text", don't push unencrypted credentials to any repository; store in secrets managers / Actions / Codespaces secrets rather than app code ([source](https://docs.github.com/en/rest/authentication/keeping-your-api-credentials-secure)).
- GitHub Docs (management): tokens "are like passwords, and they share the same inherent security risks"; prefer fine-grained tokens with minimal repo selection + permissions, set expirations ([source](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)).

**Assessment for this app:** the whole unlock model is *client-side only* (no server to hold a secret), so some client storage is unavoidable if "resume session without re-pasting" is a feature. Given that constraint, the defensible options in order:

1. **Best:** keep the token in memory only (`new Map`/module state) — user re-pastes on every page load. Zero persistence risk; matches OWASP "don't store in local storage".
2. **Compromise (what a first-time visitor friction would accept):** `sessionStorage` instead of `localStorage` — OWASP's own fallback ("use sessionStorage if persistent storage is not needed"); token survives refresh of the same tab, dies with the tab, and never sits in the profile's long-term localStorage.
3. **Keep localStorage only if** the UX decision is "remember across sessions", and pair it with honest disclosure text in the unlock panel ("token is stored in this browser's localStorage; clear it when done") — note this is against OWASP guidance for credentials, so it's a made decision, not default.

Whatever the choice: never write the token into the DOM/URL/logs, keep `sanitizeToken` (already strips non-ASCII), and keep verifying against the owner account server-side of the app (already done in `verifyToken`).

## 5. Supporting UX (primary-backed where possible)

- GitHub Docs: recommend **fine-grained tokens** over classic, minimal permissions, and expiration — worth one line of help text in the unlock panel: "create a fine-grained PAT with *Contents: Read/Write* on this repo only, with an expiration" ([source](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)).
- Input purpose validity doubles as WCAG 1.3.5 (see §2) — the label + valid token pair is the whole a11y story; no extra ARIA needed beyond label association.

---

## Files this maps to (current repo state)

| File | Finding |
|---|---|
| `src/blog/BlogAdmin.tsx` (≈L104 PAT input, L123 search input) | placeholder-only label; no autocomplete/spellcheck attrs |
| `src/blog/PostEditor.tsx` (≈L63 PAT input) | placeholder-only label; no attrs |
| `src/app/components/CMSButton.tsx` (unlock input) | placeholder-only label; no attrs |
| `src/blog/editor.tsx` (`saveBlogSession`/`loadBlogSession`) | token plaintext in `localStorage` — downgrade to memory/sessionStorage or add disclosure |

*Research note written from primary sources only; every claim above is linked to its source. Syntheses (recommendations) are marked as such where sources present options rather than a single rule.*