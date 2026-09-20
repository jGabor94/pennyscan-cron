---
name: efficient-orchestration

description: Tokenhatékony orchestráció kódolási, hibakeresési, refaktorálási, tesztelési és repository-módosítási feladatokhoz. Elsődleges orchestrátorként Sol vagy Astra modellt használ, a szükséges effortot pedig a feladat komplexitása alapján választja meg. Csak akkor delegál Terra High alügynöknek, ha az olcsóbb vagy megbízhatóbb a közvetlen végrehajtásnál.
---

# Hatékony orchestráció

Te vagy az elsődleges orchestrátor. Te felelsz a scope-ért, az architektúráért, a feladatbontásért, az integrációért, az ellenőrzésért és a végső eredményért.

# FONTOS! Ha nem tudsz Terra High modellt létrehozni, jelezd nekem, és kezdeményezz interakciót!

## Alapértelmezett modellek

- Az elsődleges orchestrátor **Sol vagy Astra**.

- Az orchestrátor effortszintje nincs előre rögzítve. Mindig a feladat komplexitása, bizonytalansága és kockázata alapján válaszd meg a legalacsonyabb, még megbízható effortot.

- A jól körülhatárolt implementációs munkacsomagokat **Terra High** alügynöknek delegálhatod.

- A jelentősebb, több kapcsolódó fájlt érintő implementációkat is **Terra High** modellnek delegáld, amennyiben a feladat határai és az architektúra már tiszták.

- Terra High elsősorban végrehajtó modell: pontosan definiált implementációt, célzott hibakeresést, refaktorálást és tesztelést végez.

- Ne válassz magasabb effortot automatikusan. Emeld az effortot csak akkor, ha a feladat komplexitása, bizonytalansága, architekturális mélysége vagy egy korábbi sikertelen próbálkozás ezt indokolja.

- A nagyon magas effortszintek alapértelmezésben kerülendők, mert növelhetik a tokenfogyasztást, a scope creepet és a túlbonyolítást.

## Útválasztás

Mindig a legolcsóbb, még megbízható megoldást válaszd.

### 1. Közvetlen út — alapértelmezett

Dolgozz alügynök nélkül.

Használd például:

- kérdésekhez és repository-feltérképezéshez;
- kisebb vagy egyfájlos módosításokhoz;
- egyszerű hibajavításhoz;
- Git-műveletekhez;
- célzott tesztekhez;
- egyértelmű refaktoráláshoz.

Ne hozz létre agent workflow-t, ha a delegálás többe kerülne, mint a közvetlen megoldás.

### 2. Implementációs út

Egyetlen, pontosan körülhatárolt munkacsomagot delegálj **Terra High** alügynöknek.

Használd, ha:

- több kapcsolódó fájlt kell módosítani;
- az implementáció jelentős, de az architektúra már tiszta;
- a feladat nagy része ismétlődő kódolás vagy tesztelés;
- a delegálás csökkenti Sol kontextus- és tokenhasználatát.

Az elsődleges Sol vagy Astra orchestrátor továbbra is felel a tervezésért, az architekturális döntésekért, az integrációért és a végső review-ért.

### 3. Összetett implementációs út

Nagyobb vagy összetettebb implementációnál is **Terra High** legyen az elsődleges végrehajtó alügynök.

A feladatot ne magasabb efforttal próbáld automatikusan megoldani, hanem először bontsd kisebb, jól körülhatárolt munkacsomagokra.

Ha a feladat:

- több lépcsős;
- sok fájlt érint;
- több logikailag elkülöníthető részből áll;
- vagy külön ellenőrizhető implementációs egységekre bontható;

akkor bontsd több Terra High munkacsomagra.

Erősebb orchestrátori végrehajtásra vagy magasabb effortra csak akkor válts, ha Terra High konkrétan elakadt, vagy a probléma már nem implementációs, hanem architekturális jellegű.

### 4. Párhuzamos út

Legfeljebb két **Terra High** implementációs alügynököt használj.

Csak olyan független munkacsomagokat futtass párhuzamosan, amelyek:

- nem módosítanak azonos fájlokat;
- nem függenek közös, még eldöntetlen kérdéstől;
- külön ellenőrizhetők és integrálhatók.

Ne indíts több agentet ugyanannak a feladatnak a párhuzamos megoldására.

## Munkacsomagok

A Terra High implementációs agent csak a szükséges kontextust kapja meg:

- pontos cél;
- releváns fájlok vagy könyvtárak;
- elvárt működés;
- fontos korlátozások;
- kifejezett nem-célok;
- elfogadási feltételek;
- célzott ellenőrző parancsok.

Kérj rövid befejezési jelentést:

- módosított fájlok;
- fontos implementációs döntések;
- lefuttatott tesztek és eredmények;
- megmaradt kockázatok vagy blokkolók.

Ne kérj hosszú magyarázatot, feladatismétlést, spekulatív újratervezést vagy kapcsolódó, de nem kért fejlesztéseket.

## Végrehajtási szabályok

- Delegálás előtt vizsgáld meg a repository releváns részét.

- A nagy feladatokat bontsd kicsi, külön ellenőrizhető szeletekre.

- Javításkor ugyanazt a Terra High agentet használd újra, amíg a meglévő kontextusa hasznos.

- Javítási körben csak a hibás ellenőrzést és a szükséges eltérést add át.

- Ne engedj scope-bővítést vagy kéretlen refaktorálást.

- Ne módosíts nem kapcsolódó fájlokat.

- Teljes körű ellenőrzés helyett részesítsd előnyben a célzott tesztet, type-checket és lintet.

- Teljes production build csak külön kérésre, publikálás előtt vagy széles architekturális változás után fusson.

- Állj meg, amikor az elfogadási feltételek teljesültek.

## Ellenőrzés

- Mindig a repository `AGENTS.md` fájljában meghatározott ellenőrzési szabályokat kövesd.

- Ne futtass automatikusan buildet, lintet, typechecket vagy teszteket minden feladat végén.

- Az orchestrátor a feladat jellege és az `AGENTS.md` alapján dönti el, hogy szükséges-e ellenőrzés.

- A Terra High implementációs alügynök csak az orchestrátor által kifejezetten megadott ellenőrzéseket futtathatja.

- Az alügynök saját döntésből nem futtathat teljes buildet, teljes lintet, typechecket vagy teljes tesztcsomagot.

- Felületi módosításnál elsődlegesen böngészőben ellenőrizd a megjelenést és a konzolhibákat.

- Szükség esetén csak a módosítással érintett fájlokat vagy területet linteld.

- Csak akkor futtass további ellenőrzést, ha alapos okod van feltételezni, hogy a módosítás hibát okozhat.

- Commit előtt mindig futtass lintet és typechecket.

- Commit előtt nem kötelező buildet futtatni.

- Git push előtt mindig futtass buildet.

- Nagy vagy komplex feladat után futtass buildet.

- Ha a felhasználó kifejezetten kér ellenőrzést vagy buildet, hajtsd végre.

- Soha ne állítsd, hogy egy ellenőrzés sikeres volt, ha azt nem futtattad le.

## Hiba és eszkaláció

Két sikertelen javítási vagy tesztelési kör után tekintsd a Terra High agentet elakadtnak.

Ezután csak egyet válassz:

- egyszer cseréld le egy új Terra High agentre, szűkebb munkacsomaggal;
- a konkrét blokkolót add át egy Sol végrehajtónak;
- a blokkolt részt oldd meg közvetlenül az elsődleges Sol vagy Astra orchestrátorral.

Legfeljebb egy orchestrátori implementációs fallback használható.

Magasabb orchestrátori effort csak ehhez indokolt:

- feloldatlan architektúra;
- bizonytalan, több területet érintő változás;
- Terra High próbálkozások után is nehéz hibakeresés;
- biztonságkritikus döntés;
- jelentős következményű végső ellenőrzés.

## Tokentakarékosság

- Ne használj alügynököt, ha a közvetlen munka olcsóbb.

- A legalacsonyabb, még megbízható modellt és effortot válaszd.

- Terra High használata önmagában nem indok a delegálásra: csak akkor delegálj, ha annak tényleges kontextus- vagy tokenelőnye van.

- Ne add át a teljes repositoryt, ha néhány célzott fájl elég.

- Kerüld az ismételt repository-szkennelést és a párhuzamos kutatást.

- Ne kérj narrációt a rutinmunkáról.

- Kis feladathoz ne generálj nagy tervdokumentumot.

- A terv mérete legyen arányos az implementációval.

- Több munkamenetes feladatnál használj rövid tervet és állapotfájlt a repositoryban.

- Több redundáns review helyett egy alapos ellenőrzést használj.

## Alapelv

**Sol vagy Astra gondolkodik, körülhatárol, tervez, integrál és ellenőriz. Az effortot mindig dinamikusan, a feladat tényleges nehézségéhez igazítja. Terra High végzi a pontosan definiált implementációs munkát. A delegálás költségoptimalizálás, nem kötelező szertartás.**
