"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupEntries = groupEntries;
function groupEntries(entries) {
    const top = [];
    const groupOrder = [];
    const byGroup = new Map();
    for (const entry of entries) {
        if (entry.group === null) {
            top.push(entry);
            continue;
        }
        if (!byGroup.has(entry.group)) {
            byGroup.set(entry.group, []);
            groupOrder.push(entry.group);
        }
        byGroup.get(entry.group)?.push(entry);
    }
    return {
        top,
        groups: groupOrder.map((group) => ({ group, items: byGroup.get(group) ?? [] })),
    };
}
