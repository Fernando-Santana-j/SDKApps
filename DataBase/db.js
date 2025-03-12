const fs = require('fs');
const path = require('path');



const timestampToDate = (timestamp) => {
  return new Date(parseInt(timestamp) * 1000);
};
// Obtém todos os arquivos de um subfolder dentro dos últimos 30 dias
const getRecentFiles = (subfolder, storeName) => {
  const dirPath = path.join(__dirname, subfolder);

  return new Promise((resolve, reject) => {
    if (!fs.existsSync(dirPath)) {
      return reject(new Error(`Pasta ${subfolder} não encontrada.`));
    }

    fs.readdir(dirPath, async (err, files) => {
      if (err) return reject(err);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const validFiles = files.filter(file => {
        const [timestamp, fileStoreName] = file.split('_');
        const fileDate = timestampToDate(timestamp);
        return fileDate >= thirtyDaysAgo && fileStoreName === storeName;
      });

      const results = [];
      for (const file of validFiles) {
        try {
          const data = await get(subfolder, file.replace('.json', ''));
          results.push({ file, data });
        } catch (error) {
          console.warn(`Erro ao ler o arquivo ${file}:`, error.message);
        }
      }

      resolve(results);
    });
  });
};



// Obtém o caminho do arquivo JSON
const getFilePath = (subfolder, filename) => {
  return path.join(__dirname, subfolder, filename + '.json');
};

// Verifica se o arquivo existe
const hasFile = (subfolder, filename) => {
  return fs.existsSync(getFilePath(subfolder, filename));
};

// Lê dados de um arquivo JSON usando stream
const get = (subfolder, filename) => {
  const filePath = getFilePath(subfolder, filename);
  return new Promise((resolve, reject) => {
    if (!hasFile(subfolder, filename)) {
      return reject(new Error(`Arquivo ${filename} não encontrado na pasta ${subfolder}`));
    }

    const readableStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    let rawData = '';

    readableStream.on('data', chunk => {
      rawData += chunk;
    });

    readableStream.on('end', () => {
      try {
        const jsonData = JSON.parse(rawData);
        resolve(jsonData);
      } catch (error) {
        reject(new Error('Erro ao ler ou parsear o arquivo JSON.'));
      }
    });

    readableStream.on('error', (error) => {
      reject(error);
    });
  });
};

// Grava ou atualiza dados em um arquivo JSON
const set = (subfolder, filename, data) => {
  const filePath = getFilePath(subfolder, filename);
  return new Promise((resolve, reject) => {
    // Criar a pasta se não existir
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const writableStream = fs.createWriteStream(filePath, { encoding: 'utf8' });
    const jsonData = JSON.stringify(data, null, 2);

    writableStream.write(jsonData);
    writableStream.end();

    writableStream.on('finish', () => {
      resolve('Dados atualizados com sucesso!');
    });

    writableStream.on('error', (error) => {
      reject(error);
    });
  });
};

// Verifica se uma chave existe dentro do JSON
const has = async (subfolder, filename, key) => {
  try {
    const data = await get(subfolder, filename);
    return data.hasOwnProperty(key);
  } catch (error) {
    return false;
  }
};

// Cria um novo arquivo JSON com um objeto inicial vazio (se não existir)
const create = (subfolder, filename) => {
  const filePath = getFilePath(subfolder, filename);
  return new Promise((resolve, reject) => {
    if (hasFile(subfolder, filename)) {
      return reject(new Error(`Arquivo ${filename} já existe em ${subfolder}`));
    }

    // Criar a pasta se não existir
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFile(filePath, JSON.stringify({}, null, 2), (err) => {
      if (err) return reject(err);
      resolve(`Arquivo ${filename} criado em ${subfolder}`);
    });
  });
};

// Remove um arquivo JSON
const remove = (subfolder, filename) => {
  const filePath = getFilePath(subfolder, filename);
  return new Promise((resolve, reject) => {
    if (!hasFile(subfolder, filename)) {
      return reject(new Error(`Arquivo ${filename} não encontrado em ${subfolder}`));
    }

    fs.unlink(filePath, (err) => {
      if (err) return reject(err);
      resolve(`Arquivo ${filename} removido de ${subfolder}`);
    });
  });
};

// Exporta todas as funções
module.exports = { get, set, has, hasFile, create, remove,getRecentFiles };
