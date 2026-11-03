# JKJ CRM – viðskiptavinakerfi fyrir fasteignasölu

Sérsmíðað CRM-kerfi fyrir sölu og leigu fasteigna, þar á meðal atvinnuhúsnæðis. Það virkar í tölvu, í síma og á opnu húsi.

## Hvað kerfið gerir

| Hluti | Lýsing |
|---|---|
| **Yfirlit** | Verkefni dagsins, næstu sýningar, söluferli, áætluð þóknun, „heitar paranir“ og hvaðan viðskiptavinir koma |
| **Tengiliðir** | Kaupendur, seljendur, leigutakar, leigusalar og samstarfsaðilar. Hver tengiliður getur haft mörg hlutverk. Smellt til að hringja, senda SMS eða tölvupóst |
| **Leitarprófíll** | Verðbil, stærð, póstnúmer, eignagerð og herbergjafjöldi kaupanda eða leigutaka |
| **Sjálfvirk pörun** | Á síðu eignar sést hvaða kaupendur passa (í %), og á síðu kaupanda sést hvaða eignir passa. Hnappur sendir öllum sem passa póst |
| **Eignir** | Fastanúmer, fasteigna- og brunabótamat, verð á m², staða og seljandi |
| **Claude** | „✨ Skrifa lýsingu með Claude“ býr til auglýsingatexta á íslensku út frá skráðum upplýsingum |
| **Auglýsingar** | „Birta auglýsingu“ sendir eignina á auglýsing.app (tengingin er tilbúin, sjá hér að neðan) |
| **Sölur (Kanban)** | Fyrirspurn → Verðmat → Söluumboð → Í auglýsingu → Tilboð → Samþykkt → Kaupsamningur → Afsal. Spjöld eru dregin milli dálka (eða stig valið í síma) |
| **Gátlisti** | Sjálfvirkur gátlisti fyrir hverja sölu eða leigu (söluumboð, veðbókarvottorð, eignaskiptayfirlýsing, kaupsamningur, afsal o.s.frv.) |
| **Tilboð** | Upphæð, fyrirvarar og gildistími. Áminning er búin til fyrir lok gildistíma og samþykkt tilboð uppfærir söluna og eignina |
| **Opið hús** | Gestaskráning í síma. Gestir verða sjálfkrafa tengiliðir og þeir sem gefa 4–5 í áhuga fá eftirfylgniverkefni næsta dag |
| **Verkefni og dagatal** | Í vanskilum, í dag, þessa viku. Vikudagatal með sýningum og verkefnum |
| **Samskiptasaga** | Símtöl, tölvupóstar, fundir og athugasemdir á tengilið, eign eða sölu, með valkvæðu eftirfylgniverkefni |
| **Microsoft 365** | Sýningar fara sjálfkrafa í Outlook-dagatalið, Outlook-viðburðir sjást í dagatali kerfisins, nýlegir póstar birtast á tengilið og hægt er að senda póst úr kerfinu (hann skráist í samskiptasögu) |
| **Claude, aðstoð** | „Samantekt“ dregur saman stöðu viðskiptavinar og stingur upp á næstu skrefum. „Drög með Claude“ skrifar tölvupóst út frá sögunni |
| **Myndir og skjöl** | Ljósmyndir, söluyfirlit, samningar og vottorð á eign, sölu eða tengilið. Fyrsta myndin er forsíðumynd eignar. Aðeins þeir sem hafa aðgang að færslunni geta opnað skjölin |
| **Leigusamningar** | Upphaf, lok, mánaðarleiga og vísitölutenging. Áminningar um endurnýjun (sjálfgefið 6 mán. fyrir lok) og yfirlit yfir samninga sem renna út á næstu 12 mánuðum |
| **Aðgangsstýring** | Stjórnandi sér allt. Fasteignasali sér eingöngu eigin gögn. Notendur eru stofnaðir og gerðir óvirkir undir ⚙︎ |

## Uppsetning

Krefst Node.js 20+.

```bash
npm install
cp .env.example .env      # breyttu AUTH_SECRET, ADMIN_EMAIL og ADMIN_PASSWORD
npm run setup:demo        # býr til gagnagrunn, stjórnanda og sýnigögn
                          # (eða `npm run setup` án sýnigagna)
npm run dev               # opnaðu http://localhost:3000
```

Í síma er hægt að velja „Bæta á heimaskjá“ og þá opnast kerfið eins og app.

### Claude

Settu `ANTHROPIC_API_KEY` í `.env` til að virkja sjálfvirkar eignalýsingar.

### Microsoft 365 (Outlook)

Þetta er gert einu sinni og tekur um 5 mínútur:

1. Farðu á **https://entra.microsoft.com**, svo **Applications → App registrations → New registration**
2. Nafn: `JKJ CRM`. Supported account types: *Accounts in this organizational directory only*
3. Redirect URI: veldu **Web** og settu `http://localhost:3000/api/microsoft/callback` (og síðar `https://<lénið-þitt>/api/microsoft/callback`)
4. Undir **Certificates & secrets → New client secret**: afritaðu *Value* í `MS_CLIENT_SECRET`
5. Afritaðu *Application (client) ID* í `MS_CLIENT_ID` og *Directory (tenant) ID* í `MS_TENANT_ID`
6. Undir **API permissions → Add → Microsoft Graph → Delegated**: `Calendars.ReadWrite`, `Mail.Read`, `Mail.Send`, `User.Read`, `offline_access`. Smelltu svo á **Grant admin consent**
7. Endurræstu kerfið, farðu í ⚙︎ og smelltu á **Tengja Microsoft 365**

Aðgangstókar eru geymdir dulkóðaðir (AES-256-GCM) í gagnagrunninum.

### auglýsing.app

Settu `AUGLYSING_API_URL` og `AUGLYSING_API_KEY` í `.env`. Án þeirra eru auglýsingar vistaðar sem drög. Aðlaga þarf `src/lib/integrations/auglysing.ts` að API-i auglýsing.app þegar skjölun þess liggur fyrir.

## Hýsing á Railway

1. **railway.com → New Project → Deploy from GitHub repo** og veldu `JKJ_VRM` (grein: `claude/real-estate-crm-system-lmetga` eða `main` eftir sameiningu)
2. Í þjónustunni: **Settings → Volumes → Add volume**, mount path `/data` (geymir gagnagrunn og myndir varanlega)
3. **Variables**: bættu við:

   | Breyta | Gildi |
   |---|---|
   | `DATABASE_URL` | `file:/data/crm.db` |
   | `UPLOAD_DIR` | `/data/uploads` |
   | `AUTH_SECRET` | langur handahófskenndur strengur (t.d. úr `openssl rand -base64 32`) |
   | `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | fyrsti stjórnandi |
   | `APP_URL` | slóðin sem Railway gefur, t.d. `https://jkj-crm.up.railway.app` |
   | `AUGLYSING_API_URL` / `AUGLYSING_API_KEY` | frá auglýsing.app |
   | `ANTHROPIC_API_KEY` | fyrir Claude (valkvætt) |
   | `MS_CLIENT_ID` / `MS_CLIENT_SECRET` / `MS_TENANT_ID` | fyrir Microsoft 365 (valkvætt) |

4. **Settings → Networking → Generate Domain** (eða tengja eigið lén)
5. Muna að bæta `https://<lénið>/api/microsoft/callback` við Redirect URI í Entra

`railway.json` sér um að byggja kerfið og við hverja ræsingu uppfærist gagnagrunnurinn og stjórnandinn er stofnaður ef hann vantar.

## Tækni

- **Next.js 15** (App Router, Server Actions) + **React 19** + **Tailwind CSS 4**
- **Prisma** + **SQLite** (einn `provider` í `prisma/schema.prisma` skiptir yfir í PostgreSQL fyrir hýsingu)
- Innskráning: bcrypt + undirrituð JWT-lota í httpOnly-köku
- `@anthropic-ai/sdk` fyrir Claude, Microsoft Graph (REST) fyrir Outlook
- Skjöl vistuð á diski (`UPLOAD_DIR`), afhent í gegnum `/api/skjol/[id]` með aðgangsathugun

```
src/
  app/
    login/            innskráning
    (app)/            allar innskráðar síður
      _actions/       server actions (gagnabreytingar + aðgangsathuganir)
      tengilidir/ eignir/ solur/ verkefni/ dagatal/ opid-hus/ leit/ notendur/
  components/         sameiginlegir viðmótshlutar
  lib/                auth, gagnagrunnur, pörun, föst gildi, tengingar
prisma/               gagnalíkan og upphafsgögn
```

## Næstu áfangar (tillögur)

1. **auglýsing.app**: klára tenginguna (með myndum) þegar API-ið liggur fyrir
2. **Hýsing**: á netinu með eigin léni, svo kerfið virki í símanum hvar sem er
3. **Verdmat**: tengja verðmatstólið (Lovable) við eignir í CRM
4. **Remax-vefurinn**: fyrirspurnir af vefnum verði sjálfkrafa tengiliðir og verkefni
5. **Sjálfvirkni**: tölvupóstur til kaupenda þegar ný eign passar og eftirfylgni eftir afhendingu
6. **Teymi**: deila tengiliðum og eignum milli fasteignasala
