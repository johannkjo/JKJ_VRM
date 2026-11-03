# JKJ CRM – viðskiptavinakerfi fyrir fasteignasölu

Sérsmíðað CRM-kerfi fyrir sölu og leigu fasteigna, þar á meðal atvinnuhúsnæðis. Það virkar í tölvu, í síma og á opnu húsi.

## Hvað kerfið gerir (áfangi 1)

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

### auglýsing.app

Settu `AUGLYSING_API_URL` og `AUGLYSING_API_KEY` í `.env`. Án þeirra eru auglýsingar vistaðar sem drög. Aðlaga þarf `src/lib/integrations/auglysing.ts` að API-i auglýsing.app þegar skjölun þess liggur fyrir.

## Tækni

- **Next.js 15** (App Router, Server Actions) + **React 19** + **Tailwind CSS 4**
- **Prisma** + **SQLite** (einn `provider` í `prisma/schema.prisma` skiptir yfir í PostgreSQL fyrir hýsingu)
- Innskráning: bcrypt + undirrituð JWT-lota í httpOnly-köku
- `@anthropic-ai/sdk` fyrir Claude

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

1. **Outlook / Microsoft 365**: samstilla dagatal (sýningar ↔ Outlook), skrá tölvupósta sjálfkrafa á tengiliði og senda póst úr kerfinu
2. **auglýsing.app**: klára tenginguna þegar API-skjölun fæst, með myndum og stöðu auglýsinga
3. **Skjöl og myndir**: hlaða upp söluyfirliti, ljósmyndum og samningum á eign eða sölu
4. **Claude, meira**: samantekt á sögu tengiliðs, drög að eftirfylgnipósti og verðmatsminnisblað
5. **Sjálfvirkni**: tölvupóstur til kaupenda þegar ný eign passar og áminningar um afmæli kaupsamninga
6. **Atvinnuleiga**: leigusamningar með lokadögum, vísitölutengingu og áminningum um endurnýjun
7. **Hýsing**: PostgreSQL + hýsing (t.d. Vercel eða Railway) og eigið lén
