# TastyTracker

TastyTracker ist eine einfache Single-Page-Anwendung zum Verwalten von Rezepten. Nach der Anmeldung können Rezepte angezeigt, erstellt, bearbeitet und gelöscht werden. Die Anwendung entstand im Rahmen des Moduls 294.

## Funktionen

- Benutzer registrieren, anmelden und abmelden
- Geschützte Rezeptübersicht mit JWT-Authentifizierung
- Rezepte erstellen, bearbeiten und löschen
- Schwierigkeitsgrad als `leicht`, `mittel` oder `schwer` festlegen
- Responsive Benutzeroberfläche ohne Frontend-Framework
- Automatisierter Browser-Test für Selenium IDE

## Technologien

- HTML5
- CSS3
- Vanilla JavaScript
- Node.js und npm
- [`@bfsbbb/json-backend`](https://www.npmjs.com/package/@bfsbbb/json-backend)
- Selenium IDE

## Voraussetzungen

- [Node.js](https://nodejs.org/) inklusive npm
- Ein lokaler Webserver, zum Beispiel die VS-Code-Erweiterung **Live Server**
- Optional: [Selenium IDE](https://www.selenium.dev/selenium-ide/) zum Ausführen des Browser-Tests

## Installation

Repository klonen und Abhängigkeiten installieren:

```bash
git clone https://github.com/mikepro100223/TastyTracker.git
cd TastyTracker
npm install
```

## Anwendung starten

1. Backend im Projektordner starten:

   ```bash
   npm start
   ```

   Die API ist danach unter `http://localhost:3000` erreichbar.

2. `index.html` über einen lokalen Webserver bereitstellen. Mit VS Code kann die Datei beispielsweise über **Open with Live Server** geöffnet werden.

3. Die Anwendung im Browser öffnen. Der Selenium-Test verwendet:

   ```text
   http://127.0.0.1:5500/#/
   ```

> Die HTML-Datei sollte nicht direkt über `file://` geöffnet werden. Verwende einen lokalen Webserver, damit alle Browserfunktionen zuverlässig arbeiten.

## Testzugang

Über **Registrieren** kann ein lokaler Testbenutzer angelegt werden. Zugangsdaten sollten nicht im Repository oder in der Dokumentation veröffentlicht werden.

## API-Endpunkte

| Methode | Endpunkt | Beschreibung |
| --- | --- | --- |
| `POST` | `/auth/register` | Benutzer registrieren |
| `POST` | `/auth/signin` | Anmelden und JWT erhalten |
| `GET` | `/data/recipes` | Alle Rezepte laden |
| `GET` | `/data/recipes/:id` | Einzelnes Rezept laden |
| `POST` | `/data/recipes` | Rezept erstellen |
| `PUT` | `/data/recipes/:id` | Rezept aktualisieren |
| `DELETE` | `/data/recipes/:id` | Rezept löschen |

Die Rezept-Endpunkte benötigen ein JWT im HTTP-Header:

```text
Authorization: Bearer <TOKEN>
```

## Tests

Der Selenium-IDE-Test befindet sich in [`Selenium tests/TastyTracker.side`](Selenium%20tests/TastyTracker.side). Vor dem Test müssen Frontend und Backend laufen. Anschließend kann die `.side`-Datei in Selenium IDE geöffnet und der Testfall **Testfall T1-3** gestartet werden.

## Projektstruktur

```text
.
├── index.html                  # Grundstruktur der Anwendung
├── style.css                   # Darstellung und responsives Layout
├── app.js                      # Routing, Authentifizierung und CRUD-Logik
├── db.json                     # Lokale Rezeptdaten
├── accounts.json               # Lokal gespeicherte Benutzerkonten
├── package.json                # Projektdefinition und Startskript
└── Selenium tests/
    └── TastyTracker.side       # Selenium-IDE-Test
```

## Hinweise zur Sicherheit

Dieses Projekt ist für eine lokale Lern- und Testumgebung vorgesehen. Das JWT-Secret im Startskript und die lokalen Benutzerdateien sollten für einen produktiven Einsatz durch Umgebungsvariablen, sichere Secrets und eine geeignete Datenbank ersetzt werden.

## Autor

Yucan You
