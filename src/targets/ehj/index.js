const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const util = require("../../util");
const { knowledge } = require("./knowledge.js");
const { garden: actionGarden } = require("./actions.js");

const garden = {
  soil: null,
  will: null,
};

async function send(theWill) {
  garden.will = theWill;
  garden.soil = await util.initPage({}, () => {}, theWill);
  let startingUrl = knowledge.plants.landscape.url;
  if (global.headless || global.visualHeadless) {
    startingUrl = knowledge.plants.protect.url;
  }
  await garden.soil.goto(startingUrl, { waitUntil: "domcontentloaded" });
  knowledge.begin(garden);
  actionGarden.soil = garden.soil;
  actionGarden.will = garden.will;
  summonGeese();
}

async function summonGeese() {
  setInterval(() => {
    applyKnowledge();
  }, 100);
}

async function applyKnowledge() {
  const sun = await garden.soil.url();
  for (const plantKey of Object.keys(knowledge.plants)) {
    const plantKnowledge = knowledge.plants[plantKey];
    // use this line to debug a certain page to avoid the timer bothering you
    // You will need also to increase the time out in summonGeese to allow time for the part you want to debug
    // if (plantKey === "gettingToKnow") {
    //   // Skip the landscape plant
    //   console.log(`Debug ${plantKey}...`);
    // }
    if (
      sun &&
      plantKnowledge.needs &&
      new RegExp(plantKnowledge.url.toLowerCase()).test(sun.toLowerCase()) &&
      !plantKnowledge.active
    ) {
      const canHarvest = await checkFreshness(plantKnowledge.needs);
      if (!canHarvest) {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(`\r${plantKey} ⌛️ waiting patiently...`);
      } else {
        process.stdout.clearLine(0); // Clear the current line
        process.stdout.cursorTo(0); // Move cursor to beginning
        process.stdout.write(`${plantKey} 🍌 ready...`);
        if (plantKnowledge.action) {
          process.stdout.clearLine(0); // Clear the current line
          process.stdout.cursorTo(0); // Move cursor to beginning
          process.stdout.write(`${plantKey} ⛏ Picking ...`);
          declareBloom(plantKey);
          try {
            await plantKnowledge.action(plantKnowledge);
          } catch (error) {
            console.error(`Error in action for ${plantKey}:`, error);
          }
        }
        break;
      }
    }
  }
}

function declareBloom(plantKeyToBloom) {
  for (const plantKey of Object.keys(knowledge.plants)) {
    if (plantKey === plantKeyToBloom) {
      knowledge.plants[plantKey].active = true;
    } else {
      // I need to forget this plant unless allowOnce is true
      if (!knowledge.plants[plantKey].allowOnce) {
        knowledge.plants[plantKey].active = false; // forget
      }
    }
  }
}

async function checkFreshness(needs) {
  // Filter out any non-string selectors
  const validNeeds = needs.filter(
    (selector) => typeof selector === "string" && selector.trim() !== ""
  );

  const soul = await Promise.all(
    validNeeds.map(async (selector) => {
      const good = await garden.soil.$(selector);
      return !!good;
    })
  );

  return soul.every(Boolean); // All selectors matched
}

module.exports = { send };
