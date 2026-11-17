import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createApp } from '../main/app.js';
import { resources } from '../main/SupportService.js';
import { ChatClient } from '../main/infrastructure/ChatClient.js';
import { EvalCase } from '../main/models/EvalCase.js';
import { JudgeResult } from '../main/models/JudgeResult.js';

const metrics = ['relevance', 'correctness', 'faithfulness', 'helpfulness', 'hallucinationFree'];

test('golden dataset: support answers meet expected behavior', async () => {
  // Build the real service behind Express; this live eval needs OpenAI credentials and API access.
  const app = await createApp();
  const supportService = app.locals.supportService;
  const judgeClient = new ChatClient();
  const cases = JSON.parse(await readFile(new URL('golden-dataset.json', resources), 'utf8'));
  const rubric = await readFile(new URL('judge-rubric.txt', resources), 'utf8');
  const totals = Object.fromEntries(metrics.map((metric) => [metric, 0]));
  const failures = [];

  for (const data of cases) {
    const evalCase = new EvalCase(data);
    const response = await supportService.chat(evalCase.question);

    // Deterministic assertions check tools and retrieval; the judge is reserved for answer quality.
    const checks = {
      'Response exists': Boolean(response.answer?.trim()),
      'Correct tool': evalCase.expectedTool === null
        ? response.toolsUsed.length === 0
        : response.toolsUsed.includes(evalCase.expectedTool),
      'Correct tool argument': evalCase.expectedTool === null ||
        response.toolArguments[evalCase.expectedTool] === evalCase.expectedToolArgument,
      'Expected source retrieved': evalCase.expectedSource === null ||
        response.retrievedDocuments.includes(evalCase.expectedSource),
    };
    const prompt = `Evaluate the AI answer below.\n\nUSER QUESTION:\n${evalCase.question}\n\n` +
      `EXPECTED ANSWER:\n${evalCase.expectedAnswer}\n\nEXPECTED BEHAVIOR:\n${evalCase.expectedBehavior}\n\n` +
      `RETRIEVED POLICY CONTEXT:\n${response.context}\n\nTOOL RESULTS:\n${JSON.stringify(response.toolResults)}\n\n` +
      `ACTUAL ANSWER:\n${response.answer}\n\n${rubric}\n\n` +
      `Return a JSON object with integer fields ${metrics.join(', ')} and a string reason.`;
    const message = await judgeClient.complete([
      { role: 'system', content: 'You are a strict evaluator of AI application responses. Return JSON.' },
      { role: 'user', content: prompt },
    ], [], true);
    const judgeResult = new JudgeResult(JSON.parse(message.content));

    for (const metric of metrics) {
      assert.ok(Number.isInteger(judgeResult[metric]) && judgeResult[metric] >= 1 && judgeResult[metric] <= 5,
        `Invalid judge score: ${metric}`);
      totals[metric] += judgeResult[metric];
    }

    const passed = Object.values(checks).every(Boolean) && metrics.every((metric) => judgeResult[metric] >= 4);
    if (!passed) failures.push(evalCase.id);
    console.log(JSON.stringify({ id: evalCase.id, checks, judge: judgeResult, result: passed ? 'PASS' : 'FAIL' }, null, 2));
  }

  const summary = {
    total: cases.length,
    passed: cases.length - failures.length,
    failed: failures.length,
    averages: Object.fromEntries(metrics.map((metric) => [
      metric,
      Math.round(totals[metric] / cases.length * 100) / 100,
    ])),
  };
  console.log('FINAL EVALUATION REPORT', summary);
  assert.deepEqual(failures, [], `Failed eval cases: ${failures.join(', ')}`);
});
