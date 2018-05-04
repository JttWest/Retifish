$(document).ready(() => {
  const baseUrl = window.location.href;

  const sendEndpoint = `${baseUrl}/send`;
  const receiveEndpoint = `${baseUrl}/receive`;

  const sendFile = () => {
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

        console.log(`Received: ${JSON.stringify(message)}`);
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

  $('#sendFileBtn').click(sendFile);
  $('#receiveBtn').click(receiveFile);
});
