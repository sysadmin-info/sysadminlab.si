# sysadminlab.si
Hugo 0.167.0 extended + Blowfish v3 (git submodule w themes/blowfish, nie edytować).
Konfiguracja: config/_default/. Języki: en (domyślny), pl, w podkatalogach /en/ i /pl/.
Deploy: Netlify z gałęzi main. Pracuj na branchach, PR do main, bez bezpośredniego pusha do main.
netlify.toml: nagłówki bezpieczeństwa i tymczasowy X-Robots-Tag noindex. Nie zmieniaj bez prośby.
Build musi przechodzić bez ostrzeżeń: hugo --gc --minify
Commity: bez trailerów Co-Authored-By i Claude-Session.
Opisy PR: bez "Generated with Claude Code" i bez linków do sesji Claude.
