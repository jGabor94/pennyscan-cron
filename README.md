# Pennyscan Cron

Cron-alapú részvényszűrő és értesítő szolgáltatás. A Trading 212 amerikai instrumentumlistájából indul ki, Yahoo Finance piaci adatokkal és IBKR borrow fee adatokkal keres napi nyerteseket, illetve short squeeze potenciállal rendelkező részvényeket. A megfelelő találatokról ntfy értesítést küld, az aznapi riasztási szintet pedig PostgreSQL-ben tárolja.

## Jelenlegi működés

A fő scanner:

1. betölti a Trading 212-ből korábban elmentett, kereskedhető amerikai részvényeket;
2. kihagyja a Yahoo Finance alapján legalább 10 milliárd USD kapitalizációjú cégeket;
3. lekéri a Yahoo Finance quote adatokat 100-as csomagokban;
4. megtartja a legalább 20%-ot emelkedő részvényeket;
5. lefuttatja rajtuk a short squeeze szűrést;
6. ntfy értesítést küld, és PostgreSQL-ben tárolja az aznapi értesítési szintet.

Értesítés készül:

- legalább 20%-os emelkedésnél, ha a részvény átmegy a short squeeze szűrésen;
- legalább 40%-os emelkedésnél short squeeze minősítéstől függetlenül;
- ugyanarról a tickerről ismét csak a következő riasztási szint elérésekor: 40%, 100%, majd további 100 százalékpontos lépésekben.

## Short squeeze feltételek

Az első, gyors előszűrés a Yahoo quote listát és a lokális IBKR JSON-t használja:

| Feltétel | Aktuális határérték |
| --- | ---: |
| Market cap | `< 10B USD` |
| Relatív volumen | `regularMarketVolume / averageDailyVolume10Day > 1` |
| Aktuális ár | `> 0.5 USD` |
| IBKR borrow fee | `> 5%` |

Az előszűrésen átjutó tickerekhez további Yahoo Finance adatok érkeznek:

| Feltétel | Aktuális határérték |
| --- | ---: |
| 30 lezárt kereskedési nap átlagos volumene | `> 500 000` |
| Float | `< 50 000 000` részvény |
| Short interest / float | `> 15%` |
| Short ratio / days to cover | `> 2` |

A 30 napos volumenátlagot a program napi chart adatokból számolja, és a folyamatban lévő kereskedési napot nem veszi bele.

A short interest / float és a short ratio jelenleg a Yahoo Finance `defaultKeyStatistics` adataiból származik. FINRA short interest vagy napi short-volume adat nincs bekötve a szűrésbe.

## Konfiguráció

A szűrési küszöbök, riasztási határok, cron kifejezések és külső kérések timeoutjai a [`src/config.ts`](src/config.ts) fájlban vannak. Ezek jelenleg kódszintű konstansok, nem környezeti változók.

Fontosabb alapértékek:

| Beállítás | Érték |
| --- | ---: |
| Short squeeze értesítési küszöb | `20%` |
| Feltétel nélküli értesítési küszöb | `40%` |
| Yahoo quote batch mérete | `100` ticker |
| Yahoo kérések timeoutja | `120 s` |
| Trading 212 / IBKR / ntfy timeout | `30 s` |

## Ütemezett feladatok

A fő scanner hétköznap, `America/New_York` időzónában fut a pre-market,
rendes kereskedés és after-hours időszakában. A többi cron az
`Europe/Budapest` időzónát használja.

| Feladat | Alapértelmezett ütemezés | Eredmény |
| --- | --- | --- |
| Fő scanner | hétköznap 04:00–19:59 között 5 percenként (New York-i idő) | Szűrés, ntfy értesítés, értesítési szint mentése PostgreSQL-be |
| Trading 212 instrumentumfrissítés | hétköznap 00:00 | `data/t212-instruments.json` |
| IBKR borrow fee frissítés | 15 percenként | `data/ibkr-borrow-fees.json` |
| Large/mega cap lista frissítés | hétfő 00:15 | `data/large-and-mega-market-cap-tickers.json` |

A JSON-fájlok ideiglenes fájlon keresztül, atomi átnevezéssel íródnak. Az azonos célfájlra induló párhuzamos írások sorba állnak, így az olvasók nem kaphatnak félkész JSON-t.

## Követelmények

- Node.js 22 vagy újabb;
- npm;
- elérhető PostgreSQL adatbázis a `notifications` táblával;
- Trading 212 API-kulcs és API-secret;
- publikus ntfy topic;
- hálózati hozzáférés a Trading 212, Yahoo Finance, IBKR FTP és ntfy szolgáltatásaihoz.

## Telepítés

```bash
npm install
```

Állítsd be az alábbi környezeti változókat a futtatási környezetben vagy a projekt lokális `.env` fájljában:

```dotenv
DATABASE_URL=postgresql://user:password@host:5432/database
NTFY_TOPIC=your-topic

T212_API_KEY=your-api-key
T212_API_SECRET=your-api-secret
T212_ENV=demo
```

A `T212_ENV` értéke `demo` vagy `live` lehet; ha nincs megadva, a program a `demo` környezetet használja. A Trading 212 hitelesítési adatok csak az instrumentumlista frissítéséhez kellenek. A cron ütemezéseket és időzónákat jelenleg a forráskód határozza meg.

## Első indítás

A fő scanner előtt hozd létre a szükséges lokális adatfájlokat ebben a sorrendben:

```bash
npm run dev:t212:once
npm run dev:large-market-cap:once
npm run dev:ibkr:once
npm run dev:once
```

A sorrend számít: a large/mega cap job a Trading 212 fájlból dolgozik, a fő scanner pedig mindhárom előállított JSON-t használja.

## Futtatás

Fejlesztési cron folyamat:

```bash
npm run dev
```

Production build és indítás:

```bash
npm run build
npm start
```

### Egyszeri futtatások

| Parancs | Funkció |
| --- | --- |
| `npm run dev:once` | A teljes fő scanner egyszeri futtatása |
| `npm run dev:t212:once` | Trading 212 instrumentumlista frissítése |
| `npm run dev:ibkr:once` | IBKR borrow fee JSON frissítése |
| `npm run dev:large-market-cap:once` | Large/mega cap kizárási lista frissítése |
| `npm run debug:short-squeeze` | Short squeeze szűrés futtatása és az eredmény rendezése relatív volumen szerint |
| `npm run ibkr:borrow-fees` | IBKR JSON közvetlen frissítése a provider CLI-val |
| `npm run ibkr:borrow-fees:print` | A frissen lekért IBKR adat kiírása stdout-ra, fájlmódosítás nélkül |

Build után ugyanezek production változatai a `start:once`, `start:t212:once`, `start:ibkr:once` és `start:large-market-cap:once` parancsok.

Az egyszeri parancsok siker esetén `0`, hiba esetén `1` kilépési kódot adnak. A hosszú életű cron folyamat egy job átmeneti hibáját naplózza, de ettől nem marad tartósan hibás kilépési állapotban.

## Ellenőrzés

TypeScript típusellenőrzés:

```bash
npm run typecheck
```

Tesztek:

```bash
npx tsx --test tests/*.test.ts
```

Production build:

```bash
npm run build
```

## Adatforrások és tárolás

- **Trading 212 API:** az elérhető instrumentumok listája.
- **Yahoo Finance:** quote adatok, market cap, volumen, float, short interest és short ratio.
- **IBKR FTP:** borrow fee, elérhető kölcsönözhető részvények és instrumentumazonosítók.
- **PostgreSQL / Drizzle ORM:** az aznapi kiküldött értesítések és elért riasztási szintek.
- **ntfy:** push értesítések.

A `data/*.json` fájlok gyorsítótárak és jobok közötti adatátadási pontok. A fő scanner nem frissíti őket automatikusan; ezt a külön ütemezett jobok végzik.

## Hibakezelés

Az ütemezett feladatok hibái a konzol mellett a projekt gyökerében található `cron-errors.txt` fájlba kerülnek. A napló 1 MiB felett `cron-errors.1.txt` néven rotálódik. A jobok `noOverlap` beállítással futnak, ezért ugyanabból a feladatból nem indul új példány, amíg az előző még dolgozik.

Külső szolgáltatás hibája vagy hiányos Yahoo-adat esetén az érintett short squeeze jelölt kimaradhat az eredményből. A lokális IBKR és Trading 212 JSON frissességét jelenleg nem ellenőrzi külön a fő scanner.

## Fontos megjegyzés

Ez egy technikai részvényszűrő, nem befektetési tanács. A Yahoo Finance, Trading 212 és IBKR mezőinek definíciója vagy frissítési gyakorisága eltérhet, ezért az eredményeket érdemes az eredeti adatforrásokkal is ellenőrizni.

_Utolsó felülvizsgálat: 2026-09-20._
