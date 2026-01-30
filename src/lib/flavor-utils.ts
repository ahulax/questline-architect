export function getEnemyImage(enemyName: string, questId: string) {
    const types = [
        'spectral_eye',
        'bureaucracy_golem',
        'git_goblin',
        'toxic_slime',
        'bone_warrior',
        'fire_drake',
        'treasure_mimic'
    ];

    const lower = (enemyName || '').toLowerCase();

    // Keyword Matching
    if (lower.includes('eye') || lower.includes('specter') || lower.includes('vision') || lower.includes('ghost')) return '/enemies/spectral_eye.png';
    if (lower.includes('golem') || lower.includes('paper') || lower.includes('bureau') || lower.includes('legal') || lower.includes('admin')) return '/enemies/bureaucracy_golem.png';
    if (lower.includes('goblin') || lower.includes('bug') || lower.includes('code') || lower.includes('syntax') || lower.includes('git')) return '/enemies/git_goblin.png';
    if (lower.includes('slime') || lower.includes('goo') || lower.includes('blob') || lower.includes('toxic') || lower.includes('mess')) return '/enemies/toxic_slime.png';
    if (lower.includes('skeleton') || lower.includes('bone') || lower.includes('warrior') || lower.includes('undead') || lower.includes('ancient')) return '/enemies/bone_warrior.png';
    if (lower.includes('dragon') || lower.includes('drake') || lower.includes('fire') || lower.includes('boss') || lower.includes('flame')) return '/enemies/fire_drake.png';
    if (lower.includes('mimic') || lower.includes('chest') || lower.includes('trap') || lower.includes('treasure') || lower.includes('side')) return '/enemies/treasure_mimic.png';

    // Stable Fallback Hash
    const hash = Math.abs(questId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
    return `/enemies/${types[hash % types.length]}.png`;
}
