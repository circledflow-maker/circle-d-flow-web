import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'fs';

const URL = process.argv[2] || 'https://circle-d-flow-web.vercel.app/pages/bantaba.html';

async function runLighthouse() {
  console.log(`[Lighthouse Agent] Launching Chrome to scan: ${URL}`);
  
  const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port
  };
  
  console.log('[Lighthouse Agent] Running audits...');
  const runnerResult = await lighthouse(URL, options);

  // Parse result to extract only actionable failed audits
  const report = JSON.parse(runnerResult.report);
  const failedAudits = [];

  for (const auditId in report.audits) {
    const audit = report.audits[auditId];
    // If score is 0 or less than 0.9, consider it something to fix
    if (audit.score !== null && audit.score < 0.9 && audit.scoreDisplayMode !== 'notApplicable' && audit.scoreDisplayMode !== 'manual') {
      failedAudits.push({
        id: audit.id,
        title: audit.title,
        description: audit.description,
        score: audit.score,
        details: audit.details
      });
    }
  }

  const output = {
    url: runnerResult.lhr.finalDisplayedUrl,
    fetchTime: runnerResult.lhr.fetchTime,
    scores: {
      performance: report.categories.performance.score * 100,
      accessibility: report.categories.accessibility.score * 100,
      bestPractices: report.categories['best-practices'].score * 100,
      seo: report.categories.seo.score * 100
    },
    actionableErrors: failedAudits
  };

  fs.writeFileSync('lighthouse_report.json', JSON.stringify(output, null, 2));
  console.log(`[Lighthouse Agent] Report generated: lighthouse_report.json`);
  console.log(`[Lighthouse Agent] Performance: ${output.scores.performance} | Accessibility: ${output.scores.accessibility} | SEO: ${output.scores.seo} | Best Practices: ${output.scores.bestPractices}`);
  console.log(`[Lighthouse Agent] Found ${failedAudits.length} actionable errors.`);
  
  await chrome.kill();
}

runLighthouse().catch(err => console.error(err));
