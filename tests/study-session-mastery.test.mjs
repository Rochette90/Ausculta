import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import {
  STUDY_SESSION_VERBS,
  studySessionMastery,
  studySessionTitle,
  studySessionVerb,
} from "../lib/study-sessions/mastery.ts";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("le verbe suit les bornes de maîtrise", () => {
  assert.equal(studySessionVerb(0), "Découvrir");
  assert.equal(studySessionVerb(29), "Découvrir");
  assert.equal(studySessionVerb(30), "Renforcer");
  assert.equal(studySessionVerb(69), "Renforcer");
  assert.equal(studySessionVerb(70), "Consolider");
  assert.equal(studySessionVerb(100), "Consolider");
});

test("les valeurs hors bornes sont ramenées dans l'intervalle", () => {
  assert.equal(studySessionVerb(-40), "Découvrir");
  assert.equal(studySessionVerb(180), "Consolider");
  assert.equal(studySessionVerb(Number.NaN), "Découvrir");
  // 29,5 % arrondit à 30 : on bascule sur « Renforcer ».
  assert.equal(studySessionVerb(29.5), "Renforcer");
  assert.equal(studySessionVerb(29.4), "Découvrir");
});

test("le titre d'une séance est composé du verbe et du sujet clinique", () => {
  assert.equal(studySessionTitle("la cardiologie", 0), "Découvrir la cardiologie");
  assert.equal(studySessionTitle("la cardiologie", 50), "Renforcer la cardiologie");
  assert.equal(studySessionTitle("la cardiologie", 72), "Consolider la cardiologie");
});

test("la maîtrise d'une séance est la part d'activités terminées", () => {
  assert.equal(studySessionMastery(0, 4), 0);
  assert.equal(studySessionMastery(1, 4), 25);
  assert.equal(studySessionMastery(3, 4), 75);
  assert.equal(studySessionMastery(4, 4), 100);
  assert.equal(studySessionMastery(0, 0), 0);
});

test("aucun titre de séance n'est écrit en dur dans un composant", async () => {
  const catalog = await read("../lib/study-sessions/catalog.ts");
  // Les séances portent un sujet clinique (indentation 4), jamais un titre
  // complet. Les étapes gardent leur propre `title`, qui n'est pas concerné.
  assert.doesNotMatch(catalog, /^ {4}title:/m);
  assert.match(catalog.split("export const studySessions")[0], /^ {2}subject: string;$/m);
  const subjects = [...catalog.matchAll(/^\s*subject: "([^"]+)"/gm)].map((match) => match[1]);
  assert.ok(subjects.length > 0, "le catalogue doit exposer des sujets");

  const forbidden = subjects.flatMap((subject) =>
    STUDY_SESSION_VERBS.map((verb) => `${verb} ${subject}`),
  );
  const offenders = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const child = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, dir);
      if (entry.isDirectory()) await walk(child);
      else if (/\.tsx?$/.test(entry.name)) {
        const source = await readFile(child, "utf8");
        for (const title of forbidden) {
          if (source.includes(title)) offenders.push(`${child.pathname} : ${title}`);
        }
      }
    }
  }
  for (const root of ["../components", "../app"]) {
    await walk(new URL(`${root}/`, import.meta.url));
  }
  assert.deepEqual(offenders, [], `titres de séance en dur : ${offenders.join(", ")}`);
});
