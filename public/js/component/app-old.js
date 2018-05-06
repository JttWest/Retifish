
const baseUrl = window.location.href;

// const sendEndpoint = `${baseUrl}/send`;
const receiveEndpoint = `${baseUrl}/receive`;

const readBlobAsArrayBuffer = (blob, fileReader = undefined) => {
  const reader = fileReader || new FileReader();

  return new Promise((resolve, reject) => {
    reader.onerror = () => {
      reader.abort();
      reject(new Error('Unable to read blob as ArrayBuffer'));
    };

    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsArrayBuffer(blob);
  });
};

const handleSessionInfo = (data) => {
  console.log(JSON.stringify(data, null, 2));
};

const handlePullChunk = (data, file, fileReader, ws) => {
  const { startByte, endByte } = data;

  const blob = file.slice(startByte, endByte);

  readBlobAsArrayBuffer(blob, fileReader)
    .then((arraybuffer) => {
      ws.send(arraybuffer);
    })
    .catch((err) => {
      console.log(err);
    });
};

const sendFile = () => {
  const fileReader = new FileReader();
  const file = document.getElementById('fileSelector').files[0];

  console.log(file.name);
  console.log(file.size);

  const ws = new WebSocket(`ws://${document.location.host}/send?fileName=${file.name}&fileSize=${file.size}`);

  ws.onerror = (err) => {
    console.log('cant open ws');
    console.log(err);
  };

  ws.onopen = () => {
    console.log('Opened websocket');

    ws.onmessage = (payload) => {
      const message = JSON.parse(payload.data);

      const { type, data } = message;

      switch (type) {
        case 'sessionInfo':
          handleSessionInfo(data);
          break;
        case 'pullChunk':
          handlePullChunk(data, file, fileReader, ws);
          break;
        default:
          throw new Error(`Unknown message type ${message.type}`);
      }
    };
  };

  // ws.onopen = () => {
  //   chunkFile(
  //     choosenFile,
  //     chunk => ws.send(chunk),
  //     () => ws.send(JSON.stringify({ type: 'endOfFile' }))
  //   );

  //   ws.onmessage = (payload) => {
  //     const data = payload.data;
  //     const message = JSON.parse(data);

  //     console.log(`Received: ${message.type}`);
  //   };
  // };

  // upload it thru websocket and check that it's being received
};

/*
function chunkFile(file, chunkCB, doneCB) {
  let fileSize = file.size;
  let chunkSize = 1000 * 1024;
  let offset = 0;
  let chunkReaderBlock = null;

  const fileReader = new FileReader();

  let readEventHandler = (evt) => {
    if (evt.target.error == null) {
      offset += chunkSize;
      chunkCB(evt.target.result); // callback for handling read chunk
    } else {
      console.log(`Read error: ${evt.target.error}`);
      return;
    }
    if (offset >= fileSize) {
      console.log('Done reading file');
      doneCB();
      return;
    }

    // of to the next chunk
    chunkReaderBlock(offset, chunkSize, file);
  };

  chunkReaderBlock = (_offset, length, _file) => {
    let blob = _file.slice(_offset, length + _offset);
    fileReader.onload = readEventHandler;
    fileReader.readAsArrayBuffer(blob);
  };

  // now let's start the read with the first block
  chunkReaderBlock(offset, chunkSize, file);
}
*/

const receiveFile = () => {
  const sessionID = $('#sessionID').val();
  const downloadUrl = `${receiveEndpoint}/${sessionID}`;

  const downloadLink = document.createElement('a');
  downloadLink.setAttribute('href', encodeURI(downloadUrl));
  downloadLink.setAttribute('download', '');

  downloadLink.style.display = 'none';
  document.body.appendChild(downloadLink);

  downloadLink.click();

  document.body.removeChild(downloadLink);
};

$(document).ready(() => {
  $('#sendFileBtn').click(sendFile);
  $('#receiveBtn').click(receiveFile);
});
