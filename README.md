# Týden v Itálii — Mobilní Administrace 📱🇮🇹

Mobilní aplikace pro správu a administraci cestovatelského deníku a blogu **Týden v Itálii**. Vyvinuto pomocí **React Native** a **Expo Go**. Běží na platformách **Android** i **iOS**.

## Hlavní funkce

*   **Rychlé přihlášení (QR Kód & Přihlašovací údaje)**: 
    *   Tradiční přihlášení pomocí e-mailu a hesla.
    *   **Bezheslové přihlášení naskenováním QR kódu** přímo z nastavení webové administrace (rychlé a pohodlné).
*   **Kompletní přehled (Dashboard)**:
    *   Statistiky návštěvnosti (celková zobrazení, unikátní návštěvy, navštívené země).
    *   Počty komentářů čekajících na moderaci.
    *   Přehledy nejnavštěvovanějších stránek, zařízení (mobil, tablet, PC) a zemí původu návštěvníků.
*   **Správa komentářů (Moderace)**:
    *   Rychlé schvalování, označování za spam a mazání komentářů přímo z telefonu.
*   **Správa cest (Trips)**:
    *   Vytváření a úprava cest (termíny, vícejazyčné názvy a popisy).
    *   Nahrávání úvodních fotografií cesty přímo z galerie nebo fotoaparátu.
*   **Správa blogu (Články)**:
    *   Psaní a editace článků ve třech jazykových mutacích (CZ, EN, IT).
    *   Nastavení SEO meta-tagů.
    *   Nahrávání fotografií a videí do obsahu článku.
*   **Chytré nahrávání a konverze médií (HEIC / RAW)**:
    *   Automatická komprese vybraných fotografií před nahráním na server.
    *   **Převod Apple HEIC a fotoaparátových RAW formátů** přímo na straně telefonu do standardního formátu JPEG před odesláním. Ušetří datový tarif a zamezí chybám na straně serveru.
*   **Push notifikace**:
    *   Přijímání upozornění na nové komentáře ke schválení.

## Technická specifikace

*   **Framework**: React Native (Expo SDK 57)
*   **Zabezpečení**: `expo-secure-store` pro bezpečné šifrované uložení API tokenu
*   **Fotoaparát**: `expo-camera` pro snímání QR kódů
*   **Média**: `expo-image-picker` a `expo-image-manipulator` pro výběr a transformace obrázků

---

## Jak spustit aplikaci lokálně v Expo Go

### 1. Prerekvizity
Ujistěte se, že máte nainstalované prostředí **Node.js** a na mobilním telefonu aplikaci **Expo Go** (dostupná zdarma v Google Play a App Store).

### 2. Instalace závislostí
V adresáři aplikace spusťte:
```bash
npm install
```

### 3. Spuštění vývojového serveru
Spusťte příkaz:
```bash
npx expo start
```
V terminálu se zobrazí velký **QR kód**.

### 4. Spuštění na zařízení
*   **Android**: Otevřete aplikaci *Expo Go*, zvolte možnost "Scan QR Code" a naskenujte kód z terminálu.
*   **iOS (iPhone)**: Otevřete systémovou aplikaci *Fotoaparát*, naskenujte QR kód z terminálu a otevřete odkaz v aplikaci *Expo Go*.

---

## Licence
Tento projekt je licencován pod MIT licencí. Více informací naleznete v souboru `LICENSE`.
