#!/usr/bin/env python
"""
Eventfrog → mus_export.json (Museum Schaffen / museumschaffen.ch)
=================================================================

Gleiches Record-Layout wie coucou_export.json (Coucou-Schnittstelle 1.4),
aber nur Events der Eventfrog-Organisation 5116588 (Museum Schaffen).

Beschreibung (wie coucou_export.json):
    description       Kurzbeschreibung
    description_long  Lange Eventbeschreibung (Klartext)
    description_html  Lange Eventbeschreibung (HTML)

Öffentliche URL für die Agentur von museumschaffen.ch:
    https://www.hvwinterthur.ch/mus_export.json

Hostpoint-Cron (täglich, z.B. 03:05):
    cd /home/zozuhosa/cronjobs && /usr/local/bin/python eventfrog_to_mus.py >/dev/null 2>&1
"""

from __future__ import print_function

import os

# Muss VOR dem Import von eventfrog_to_coucou gesetzt werden (Config zur Laufzeit).
os.environ["HVW_ORG_IDS"] = "5116588"
os.environ["HVW_EXPORT_FILENAME"] = "mus_export.json"
os.environ["HVW_WRITE_HOME_EVENTS"] = "0"

from eventfrog_to_coucou import main  # noqa: E402


if __name__ == "__main__":
    main()
