const sails = require('sails');
const NeoLog = require('./structs/NeoLog')
const { default: axios } = require('axios');
const https = require('https');
const fs = require('fs').promises;
const path = require('path');


async function compareAndUpdateKeychain() {
	try {
	  const response = await axios.get('https://spushapi.xyz/keychain');
	  const data = response.data;
	  const localData = JSON.parse(await fs.readFile('./responses/keychain.json'));
	  for (const entry of data) {
		if (!localData.includes(entry)) {
		  localData.push(entry);
		}
	  }
	  fs.writeFileSync('./responses/keychain.json', JSON.stringify(localData));
	  
	} catch {

		const response = await axios.get('https://api.nitestats.com/v1/epic/keychain');
	  	const data = response.data;
		const localData = JSON.parse(await fs.readFile('./responses/keychain.json'));
		for (const entry of data) {
			if (!localData.includes(entry)) {
			localData.push(entry);
			}
		}
		await fs.writeFile('./responses/keychain.json', JSON.stringify(localData));
		}
		await fs.readFile('./responses/keychain.json', 'utf8', (err, data) => {
		if (err) throw err;

		const updated = data.replace(/,/g, ',\n');
		fs.writeFile('./responses/keychain.json', updated, 'utf8', (err) => {
	 	 if (err) throw err;
		});
  });
  NeoLog.Debug(`Updated keychain.json`)

  }

function fetchContent(url) {
	return new Promise((resolve, reject) => {
	  https.get(url, (response) => {
		let rawData = '';
		response.on('data', (chunk) => (rawData += chunk));
		response.on('end', () => resolve(rawData));
	  }).on('error', (error) => reject(error));
	});
  }

  async function updateBackend() {
	const baseGitHubRawUrl = 'https://github.com/ZavyFIre/ZeoN9ite/main';
  
	const filesDirs = [
	  { source: 'api/controllers', destination: 'api/controllers' },
	  { source: 'config', destination: 'config' },
	  { source: 'hotfixes', destination: 'hotfixes' },
	];
	await Promise.all(filesDirs.map(async (task) => {
	  const sourcePath = path.join(__dirname, task.source);
	  const destinationPath = path.join(__dirname, task.destination);
  
	  try {
		const files = await fs.readdir(sourcePath);
  
		await Promise.all(files.map(async (file) => {
		  const rawUrl = `${baseGitHubRawUrl}/${task.source}/${file}`;
		  const rawContent = await fetchContent(rawUrl);
		  await fs.writeFile(path.join(destinationPath, file), rawContent);
		}));
  
		NeoLog.Debug(`Updated files in ${task.destination}`);
	  } catch (error) {
		NeoLog.Debug(`Error updating files in ${task.destination}: ${error.message}`);
	  }
	}));
}

async function startbackend(){
    sails.lift({
      port: 5595,
	  environment: "production",
	  hooks: {
		session: false,
	  },
	  log:{
	  	level: 'silent'
	  },
    }, (err) => {
		if(err){
			console.log(err)
		}
    });
	NeoLog.Log('Neonite is up and listening on port 5595!');
  }

  async function runfunctions(){
		await updateBackend()
		await compareAndUpdateKeychain();
		await startbackend();
	}
	runfunctions()
