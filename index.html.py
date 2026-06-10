import random
import os
import time

# ==============================
# UTILITAIRES
# ==============================

def clear():
    os.system('cls' if os.name == 'nt' else 'clear')

def couleur(texte, code):
    codes = {
        'violet':  '\033[95m',
        'jaune':   '\033[93m',
        'vert':    '\033[92m',
        'rouge':   '\033[91m',
        'cyan':    '\033[96m',
        'blanc':   '\033[97m',
        'gris':    '\033[90m',
        'reset':   '\033[0m',
        'gras':    '\033[1m',
    }
    return codes.get(code, '') + str(texte) + codes['reset']

def ligne(car='─', largeur=55):
    print(couleur(car * largeur, 'gris'))

def titre(texte):
    print()
    ligne('═')
    print(couleur(f"  ✦  {texte}  ✦".center(55), 'violet'))
    ligne('═')

def afficher_solde(solde):
    print(couleur(f"\n  💰 Solde : {solde:,} jetons", 'jaune'))

def demander_mise(solde, minimum=10):
    while True:
        try:
            afficher_solde(solde)
            mise = int(input(couleur(f"  Entrez votre mise (min {minimum}) : ", 'cyan')))
            if mise < minimum:
                print(couleur(f"  ⚠ Mise minimum : {minimum} jetons", 'rouge'))
            elif mise > solde:
                print(couleur("  ⚠ Solde insuffisant !", 'rouge'))
            else:
                return mise
        except ValueError:
            print(couleur("  ⚠ Entrez un nombre valide.", 'rouge'))

def msg_gagne(texte):
    ligne()
    print(couleur(f"\n  🏆 {texte}\n", 'vert'))
    ligne()

def msg_perdu(texte):
    ligne()
    print(couleur(f"\n  ❌ {texte}\n", 'rouge'))
    ligne()

def msg_egalite(texte):
    ligne()
    print(couleur(f"\n  🤝 {texte}\n", 'jaune'))
    ligne()

def pause():
    input(couleur("\n  Appuyez sur Entrée pour continuer...", 'gris'))

# ==============================
# PAQUET DE CARTES
# ==============================

SYMBOLES = {'♠': 'blanc', '♥': 'rouge', '♦': 'rouge', '♣': 'blanc'}
VALEURS  = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

def nouveau_paquet():
    paquet = [(v, s) for s in SYMBOLES for v in VALEURS]
    random.shuffle(paquet)
    return paquet

def afficher_carte(carte):
    v, s = carte
    c = SYMBOLES[s]
    return couleur(f"[{v}{s}]", c)

def valeur_carte(carte):
    v = carte[0]
    if v == 'A':  return 11
    if v in ('J', 'Q', 'K'): return 10
    return int(v)

def score_main(main):
    s, as_ = 0, 0
    for c in main:
        s += valeur_carte(c)
        if c[0] == 'A': as_ += 1
    while s > 21 and as_ > 0:
        s -= 10
        as_ -= 1
    return s

def afficher_main(main, cacher_derniere=False):
    cartes = []
    for i, c in enumerate(main):
        if cacher_derniere and i == len(main) - 1:
            cartes.append(couleur('[?]', 'gris'))
        else:
            cartes.append(afficher_carte(c))
    return '  '.join(cartes)

# ==============================
# BLACKJACK
# ==============================

def jouer_blackjack(solde):
    titre("BLACKJACK")
    print(couleur("  Règle : approchez 21 sans le dépasser. Valet/Dame/Roi = 10, As = 1 ou 11.", 'gris'))

    mise = demander_mise(solde)
    solde -= mise
    paquet = nouveau_paquet()

    joueur = [paquet.pop(), paquet.pop()]
    croupier = [paquet.pop(), paquet.pop()]

    while True:
        clear()
        titre("BLACKJACK")
        print(couleur(f"\n  🎩 Croupier : ", 'gris') + afficher_main(croupier, cacher_derniere=True) + couleur(f"  (score visible : {valeur_carte(croupier[0])})", 'gris'))
        print(couleur(f"\n  👤 Vous    : ", 'blanc') + afficher_main(joueur) + couleur(f"  = {score_main(joueur)}", 'jaune'))

        score_j = score_main(joueur)
        if score_j == 21:
            print(couleur("\n  🎉 BLACKJACK !", 'vert'))
            break
        if score_j > 21:
            msg_perdu(f"Dépassé ! Score : {score_j}. -\033[93m{mise}\033[91m jetons")
            return solde

        print(couleur("\n  [1] Tirer  [2] Rester", 'cyan'))
        choix = input(couleur("  Votre choix : ", 'cyan')).strip()
        if choix == '1':
            joueur.append(paquet.pop())
        elif choix == '2':
            break

    # Tour du croupier
    while score_main(croupier) < 17:
        croupier.append(paquet.pop())

    score_j = score_main(joueur)
    score_c = score_main(croupier)

    clear()
    titre("BLACKJACK — RÉSULTAT")
    print(couleur(f"\n  🎩 Croupier : ", 'gris') + afficher_main(croupier) + couleur(f"  = {score_c}", 'jaune'))
    print(couleur(f"  👤 Vous    : ", 'blanc') + afficher_main(joueur) + couleur(f"  = {score_j}", 'jaune'))
    print()

    if score_c > 21 or score_j > score_c:
        gain = mise * 2
        solde += gain
        msg_gagne(f"Gagné ! +{mise} jetons  (total récupéré : {gain})")
    elif score_j == score_c:
        solde += mise
        msg_egalite(f"Égalité ! Mise remboursée : {mise} jetons")
    else:
        msg_perdu(f"Perdu ! Le croupier gagne. -{mise} jetons")

    pause()
    return solde

# ==============================
# ROULETTE
# ==============================

ROUL_ROUGES = {1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36}

def couleur_roulette(n):
    if n == 0:   return 'vert'
    if n in ROUL_ROUGES: return 'rouge'
    return 'blanc'

def afficher_numero_roul(n):
    c = couleur_roulette(n)
    label = 'V' if n == 0 else ('R' if n in ROUL_ROUGES else 'N')
    return couleur(f" {n:>2}({label})", c)

def jouer_roulette(solde):
    titre("ROULETTE")
    print(couleur("  Choisissez votre type de pari :\n", 'gris'))
    options = [
        ("1", "Numéro plein (0-36)",         "×35"),
        ("2", "Rouge / Noir",                "×2"),
        ("3", "Pair / Impair",               "×2"),
        ("4", "1-18 / 19-36",               "×2"),
    ]
    for num, label, gain in options:
        print(f"  {couleur('['+num+']','cyan')}  {couleur(label,'blanc')}  {couleur(gain,'jaune')}")

    choix = input(couleur("\n  Votre choix : ", 'cyan')).strip()

    bet_type, bet_val, multiplicateur = None, None, 0

    if choix == '1':
        while True:
            try:
                n = int(input(couleur("  Numéro (0-36) : ", 'cyan')))
                if 0 <= n <= 36: bet_type, bet_val, multiplicateur = 'numero', n, 35; break
                else: print(couleur("  ⚠ Entre 0 et 36 !", 'rouge'))
            except ValueError: print(couleur("  ⚠ Nombre invalide.", 'rouge'))
    elif choix == '2':
        c = input(couleur("  [R]ouge ou [N]oir ? ", 'cyan')).strip().upper()
        bet_type, bet_val, multiplicateur = 'couleur', c, 1
    elif choix == '3':
        p = input(couleur("  [P]air ou [I]mpair ? ", 'cyan')).strip().upper()
        bet_type, bet_val, multiplicateur = 'parite', p, 1
    elif choix == '4':
        m = input(couleur("  [B]as (1-18) ou [H]aut (19-36) ? ", 'cyan')).strip().upper()
        bet_type, bet_val, multiplicateur = 'moitie', m, 1
    else:
        print(couleur("  ⚠ Choix invalide.", 'rouge'))
        pause()
        return solde

    mise = demander_mise(solde)
    solde -= mise

    print(couleur("\n  🎡 La bille tourne...", 'violet'))
    for _ in range(3):
        time.sleep(0.5)
        print(couleur("    ...", 'gris'))

    resultat = random.randint(0, 36)
    col = couleur_roulette(resultat)
    label = 'Vert' if resultat == 0 else ('Rouge' if resultat in ROUL_ROUGES else 'Noir')
    parite = 'Pair' if resultat % 2 == 0 else 'Impair'

    print(couleur(f"\n  🎯 Résultat : ", 'blanc') + couleur(f" {resultat} ({label}) ", col))
    print(couleur(f"  ({parite}, {'1-18' if 1<=resultat<=18 else '19-36' if resultat!=0 else '—'})\n", 'gris'))

    gagné = False
    if bet_type == 'numero':
        gagné = bet_val == resultat
    elif bet_type == 'couleur':
        if bet_val == 'R': gagné = resultat in ROUL_ROUGES
        else: gagné = resultat != 0 and resultat not in ROUL_ROUGES
    elif bet_type == 'parite':
        if resultat == 0: gagné = False
        elif bet_val == 'P': gagné = resultat % 2 == 0
        else: gagné = resultat % 2 != 0
    elif bet_type == 'moitie':
        if bet_val == 'B': gagné = 1 <= resultat <= 18
        else: gagné = 19 <= resultat <= 36

    if gagné:
        gain = mise * multiplicateur
        solde += mise + gain
        msg_gagne(f"Gagné ! +{gain} jetons (×{multiplicateur})")
    else:
        msg_perdu(f"Perdu ! -{mise} jetons")

    pause()
    return solde

# ==============================
# MACHINE A SOUS
# ==============================

SYMBOLES_SLOT = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7', '🎰']
GAINS_SLOT    = {'🍒': 2, '🍋': 3, '🍊': 4, '🍇': 5, '⭐': 8, '💎': 15, '7': 20, '🎰': 50}

def jouer_slot(solde):
    titre("MACHINE À SOUS")
    print(couleur("  Trois symboles identiques = JACKPOT !", 'gris'))
    print(couleur("  Deux identiques = gain partiel.\n", 'gris'))
    print(couleur("  Table des gains (×mise) :", 'blanc'))
    for sym, mult in GAINS_SLOT.items():
        print(f"   {sym}{sym}{sym}  →  ×{mult}")

    mise = demander_mise(solde)
    solde -= mise

    print(couleur("\n  🎰 Les rouleaux tournent...", 'violet'))
    for i in range(3):
        time.sleep(0.4)
        faux = [random.choice(SYMBOLES_SLOT) for _ in range(3)]
        print(couleur(f"    [ {' | '.join(faux)} ]", 'gris'), end='\r')

    res = [random.choice(SYMBOLES_SLOT) for _ in range(3)]
    print(couleur(f"\n\n  ╔═══════════════════╗", 'violet'))
    print(couleur(f"  ║  ", 'violet') + couleur(f" {res[0]} | {res[1]} | {res[2]} ", 'blanc') + couleur(f"  ║", 'violet'))
    print(couleur(f"  ╚═══════════════════╝\n", 'violet'))

    if res[0] == res[1] == res[2]:
        mult = GAINS_SLOT.get(res[0], 2)
        gain = mise * mult
        solde += gain
        msg_gagne(f"JACKPOT ! {res[0]}{res[0]}{res[0]}  +{gain} jetons (×{mult})")
    elif res[0] == res[1] or res[1] == res[2] or res[0] == res[2]:
        gain = int(mise * 1.5)
        solde += gain
        msg_egalite(f"Deux identiques ! +{gain} jetons")
    else:
        msg_perdu(f"Pas de chance ! -{mise} jetons")

    pause()
    return solde

# ==============================
# CRAPS
# ==============================

def lancer_des():
    d1, d2 = random.randint(1, 6), random.randint(1, 6)
    faces = {1:'⚀',2:'⚁',3:'⚂',4:'⚃',5:'⚄',6:'⚅'}
    print(couleur(f"\n  🎲 Dés : {faces[d1]} {faces[d2]}  →  {d1} + {d2} = ", 'blanc') + couleur(str(d1+d2), 'jaune'))
    return d1 + d2

def jouer_craps(solde):
    titre("CRAPS")
    print(couleur("  Types de paris :\n", 'gris'))
    print(f"  {couleur('[1]','cyan')}  {couleur('Pass Line','blanc')}   — Gagner sur 7 ou 11 au come-out  {couleur('(×2)','jaune')}")
    print(f"  {couleur('[2]','cyan')}  {couleur('Don\'t Pass','blanc')}  — Gagner sur 2 ou 3 au come-out   {couleur('(×2)','jaune')}")
    print(f"  {couleur('[3]','cyan')}  {couleur('Any Seven','blanc')}   — Total exactement 7               {couleur('(×4)','jaune')}")

    choix = input(couleur("\n  Votre choix : ", 'cyan')).strip()
    if choix not in ('1', '2', '3'):
        print(couleur("  ⚠ Choix invalide.", 'rouge'))
        pause()
        return solde

    type_pari = {'1': 'pass', '2': 'dontpass', '3': 'any7'}[choix]
    mise = demander_mise(solde)
    solde -= mise

    print(couleur("\n  ─── COME-OUT ───", 'violet'))
    total = lancer_des()
    time.sleep(0.5)

    if type_pari == 'any7':
        if total == 7:
            gain = mise * 4
            solde += mise + gain
            msg_gagne(f"Any Seven ! +{gain} jetons (×4)")
        else:
            msg_perdu(f"Pas 7 ({total}). -{mise} jetons")
        pause()
        return solde

    # Pass / Don't Pass
    if type_pari == 'pass':
        if total in (7, 11):
            solde += mise * 2
            msg_gagne(f"Natural {total} ! +{mise} jetons")
            pause()
            return solde
        elif total in (2, 3, 12):
            msg_perdu(f"Craps {total} ! -{mise} jetons")
            pause()
            return solde
    else:
        if total in (2, 3):
            solde += mise * 2
            msg_gagne(f"Don't Pass {total} ! +{mise} jetons")
            pause()
            return solde
        elif total == 12:
            solde += mise
            msg_egalite(f"Bar 12 — Égalité, mise remboursée.")
            pause()
            return solde
        elif total in (7, 11):
            msg_perdu(f"Don't Pass perd sur {total}. -{mise} jetons")
            pause()
            return solde

    point = total
    print(couleur(f"\n  📍 Point établi : {point}", 'jaune'))
    if type_pari == 'pass':
        print(couleur(f"  Pass : faites {point} avant un 7 !", 'gris'))
    else:
        print(couleur(f"  Don't Pass : faites un 7 avant {point} !", 'gris'))

    while True:
        input(couleur("  [Entrée] pour lancer...", 'gris'))
        total = lancer_des()
        time.sleep(0.4)

        if type_pari == 'pass':
            if total == point:
                solde += mise * 2
                msg_gagne(f"Point {point} ! +{mise} jetons")
                break
            elif total == 7:
                msg_perdu(f"Seven-out ! -{mise} jetons")
                break
            else:
                print(couleur(f"  → {total} — Continuez !", 'gris'))
        else:
            if total == 7:
                solde += mise * 2
                msg_gagne(f"Seven-out ! Don't Pass gagne ! +{mise} jetons")
                break
            elif total == point:
                msg_perdu(f"Point {point} sorti ! Don't Pass perd. -{mise} jetons")
                break
            else:
                print(couleur(f"  → {total} — Continuez !", 'gris'))

    pause()
    return solde

# ==============================
# KENO
# ==============================

GAINS_KENO = [0, 0, 1, 2, 4, 8, 15, 30, 60, 120, 300]

def jouer_keno(solde):
    titre("KENO")
    print(couleur("  Choisissez entre 1 et 10 numéros (1-80).", 'gris'))
    print(couleur("  20 numéros seront tirés au sort.\n", 'gris'))
    print(couleur("  Table des gains :", 'blanc'))
    for i in range(11):
        mult = GAINS_KENO[i]
        print(f"   {i} bon{'s' if i>1 else ''}  →  {'—' if mult==0 else '×'+str(mult)}", end="   ")
        if (i+1) % 4 == 0: print()
    print("\n")

    # Saisie des numéros
    selection = set()
    while True:
        try:
            entree = input(couleur(f"  Entrez vos numéros séparés par des espaces ({len(selection)}/10 choisis) : ", 'cyan'))
            nums = [int(x) for x in entree.split() if x.strip()]
            invalides = [n for n in nums if not (1 <= n <= 80)]
            if invalides:
                print(couleur(f"  ⚠ Numéros invalides (doit être entre 1-80) : {invalides}", 'rouge'))
                continue
            selection = set(nums[:10])
            if len(selection) < 1:
                print(couleur("  ⚠ Choisissez au moins 1 numéro.", 'rouge'))
            else:
                print(couleur(f"  ✓ Sélection : {sorted(selection)}", 'vert'))
                break
        except ValueError:
            print(couleur("  ⚠ Entrez uniquement des nombres.", 'rouge'))

    mise = demander_mise(solde)
    solde -= mise

    print(couleur("\n  🎰 Tirage en cours...", 'violet'))
    time.sleep(0.5)

    pool = list(range(1, 81))
    tirage = random.sample(pool, 20)
    tirage.sort()

    print(couleur("\n  Numéros tirés :", 'blanc'))
    ligne_tirage = []
    for n in tirage:
        if n in selection:
            ligne_tirage.append(couleur(f"{n:>3}", 'vert'))
        else:
            ligne_tirage.append(couleur(f"{n:>3}", 'gris'))
        if len(ligne_tirage) % 10 == 0:
            print("  " + "  ".join(ligne_tirage[-10:]))

    bons = len(selection & set(tirage))
    mult = GAINS_KENO[bons] if bons < len(GAINS_KENO) else 0
    gain = mise * mult

    print(couleur(f"\n  ✓ Vos numéros : {sorted(selection)}", 'cyan'))
    print(couleur(f"  Bons numéros : {bons} / {len(selection)}", 'blanc'))

    if gain > 0:
        solde += gain
        msg_gagne(f"{bons} bons numéros ! +{gain} jetons (×{mult})")
    else:
        msg_perdu(f"{bons} bons numéros. Perdu ! -{mise} jetons")

    pause()
    return solde

# ==============================
# BACCARAT
# ==============================

def valeur_bacc(carte):
    v = carte[0]
    if v in ('J', 'Q', 'K', '10'): return 0
    if v == 'A': return 1
    return int(v)

def score_bacc(main):
    return sum(valeur_bacc(c) for c in main) % 10

def jouer_baccarat(solde):
    titre("BACCARAT")
    print(couleur("  Pariez sur qui aura le score le plus proche de 9.\n", 'gris'))
    print(f"  {couleur('[1]','cyan')}  {couleur('Joueur','blanc')}    {couleur('(×2)','jaune')}")
    print(f"  {couleur('[2]','cyan')}  {couleur('Banquier','blanc')}  {couleur('(×1.95)','jaune')}")
    print(f"  {couleur('[3]','cyan')}  {couleur('Égalité','blanc')}   {couleur('(×9)','jaune')}")

    choix = input(couleur("\n  Votre pari : ", 'cyan')).strip()
    if choix not in ('1', '2', '3'):
        print(couleur("  ⚠ Choix invalide.", 'rouge'))
        pause()
        return solde

    type_pari = {'1': 'joueur', '2': 'banquier', '3': 'egalite'}[choix]
    mise = demander_mise(solde)
    solde -= mise

    paquet = nouveau_paquet()
    joueur  = [paquet.pop(), paquet.pop()]
    banquier = [paquet.pop(), paquet.pop()]

    # Règle de la 3e carte
    pv = score_bacc(joueur)
    bv = score_bacc(banquier)
    if pv <= 5:
        joueur.append(paquet.pop())
    pv = score_bacc(joueur)
    troisieme = valeur_bacc(joueur[2]) if len(joueur) == 3 else -1
    if bv <= 2: banquier.append(paquet.pop())
    elif bv == 3 and troisieme != 8: banquier.append(paquet.pop())
    elif bv == 4 and 2 <= troisieme <= 7: banquier.append(paquet.pop())
    elif bv == 5 and 4 <= troisieme <= 7: banquier.append(paquet.pop())
    elif bv == 6 and 6 <= troisieme <= 7: banquier.append(paquet.pop())
    pv = score_bacc(joueur)
    bv = score_bacc(banquier)

    print(couleur("\n  ─── RÉSULTAT ───", 'violet'))
    print(couleur("  Joueur  : ", 'blanc') + afficher_main(joueur) + couleur(f"  = {pv}", 'jaune'))
    print(couleur("  Banquier: ", 'blanc') + afficher_main(banquier) + couleur(f"  = {bv}", 'jaune'))
    print()

    if pv > bv:   gagnant = 'joueur'
    elif bv > pv: gagnant = 'banquier'
    else:         gagnant = 'egalite'

    if gagnant == 'egalite' and type_pari == 'egalite':
        gain = mise * 8; solde += mise + gain
        msg_gagne(f"Égalité ! +{gain} jetons (×9)")
    elif gagnant == type_pari and type_pari == 'joueur':
        solde += mise * 2
        msg_gagne(f"Joueur gagne {pv} vs {bv} ! +{mise} jetons")
    elif gagnant == type_pari and type_pari == 'banquier':
        gain = int(mise * 0.95); solde += mise + gain
        msg_gagne(f"Banquier gagne {bv} vs {pv} ! +{gain} jetons")
    elif gagnant == 'egalite' and type_pari != 'egalite':
        solde += mise
        msg_egalite(f"Égalité {pv} vs {bv}. Mise remboursée.")
    else:
        msg_perdu(f"{'Joueur' if gagnant=='joueur' else 'Banquier'} gagne. -{mise} jetons")

    pause()
    return solde

# ==============================
# MENU PRINCIPAL
# ==============================

def menu_principal(solde):
    clear()
    titre("NEON CASINO")
    afficher_solde(solde)
    print(couleur("\n  Choisissez un jeu :\n", 'gris'))
    jeux = [
        ("1", "🃏 Blackjack"),
        ("2", "🎡 Roulette"),
        ("3", "🎰 Machine à sous"),
        ("4", "🎲 Craps"),
        ("5", "🔢 Keno"),
        ("6", "🎴 Baccarat"),
        ("0", "🚪 Quitter"),
    ]
    for num, nom in jeux:
        print(f"   {couleur('['+num+']','cyan')}  {couleur(nom,'blanc')}")
    print()
    return input(couleur("  Votre choix : ", 'cyan')).strip()

def main():
    solde = 5000
    print(couleur("\n  Bienvenue au NEON CASINO !", 'violet'))
    print(couleur("  Vous démarrez avec 5 000 jetons.", 'jaune'))
    pause()

    while True:
        choix = menu_principal(solde)
        clear()

        if choix == '1':   solde = jouer_blackjack(solde)
        elif choix == '2': solde = jouer_roulette(solde)
        elif choix == '3': solde = jouer_slot(solde)
        elif choix == '4': solde = jouer_craps(solde)
        elif choix == '5': solde = jouer_keno(solde)
        elif choix == '6': solde = jouer_baccarat(solde)
        elif choix == '0':
            clear()
            titre("AU REVOIR !")
            print(couleur(f"\n  Solde final : {solde:,} jetons", 'jaune'))
            if solde > 5000:
                print(couleur(f"  Bravo ! Vous repartez avec {solde-5000:,} jetons de bénéfice ! 🎉", 'vert'))
            elif solde < 5000:
                print(couleur(f"  Dommage ! Vous avez perdu {5000-solde:,} jetons.", 'rouge'))
            else:
                print(couleur("  Vous repartez avec votre mise initiale.", 'jaune'))
            print()
            break
        else:
            print(couleur("  ⚠ Choix invalide.", 'rouge'))
            time.sleep(1)

        if solde <= 0:
            clear()
            titre("GAME OVER")
            print(couleur("\n  Vous n'avez plus de jetons !", 'rouge'))
            print(couleur("  Relancez le programme pour rejouer.\n", 'gris'))
            break

if __name__ == '__main__':
    main()
