$(document).ready(function () {
    const baseUrl = window.location.href;

    const downloadEndpoint = baseUrl + 'download';

    $("#uploadBtn").click(chunkedUpload)

    const chunkedUpload = () => {
        const choosenFile = document.getElementById('fileSelector').files[0];

        console.log(choosenFile.name);
        console.log(choosenFile.size);

        const ws = new WebSocket("ws://" + document.location.host + "/upload");

        ws.onopen = () => {
            chunkFile(choosenFile,
                chunk => ws.send(chunk),
                () => ws.send(JSON.stringify({ type: 'endOfFile' }))
            );

            ws.onmessage = (payload) => {
                const data = payload.data;
                const message = JSON.parse(data);

                console.log("Received: " + message.type)
            }
        }

        // upload it thru websocket and check that it's being received
    };

    function chunkFile(file, chunkCB, doneCB) {
        var fileSize = file.size;
        var chunkSize = 1000 * 1024;
        var offset = 0;
        var chunkReaderBlock = null;

        const fileReader = new FileReader();

        var readEventHandler = function (evt) {
            if (evt.target.error == null) {
                offset += chunkSize;
                chunkCB(evt.target.result); // callback for handling read chunk
            } else {
                console.log("Read error: " + evt.target.error);
                return;
            }
            if (offset >= fileSize) {
                console.log("Done reading file");
                doneCB();
                return;
            }

            // of to the next chunk
            chunkReaderBlock(offset, chunkSize, file);
        }

        chunkReaderBlock = function (_offset, length, _file) {
            var blob = _file.slice(_offset, length + _offset);
            fileReader.onload = readEventHandler;
            fileReader.readAsArrayBuffer(blob);
        }

        // now let's start the read with the first block
        chunkReaderBlock(offset, chunkSize, file);
    }

    $("#downloadBtn").click(() => {
        const downloadUrl = `${nodeUrl}????` // TODO

        const downloadLink = document.createElement('a');
        downloadLink.setAttribute('href', encodeURI(downloadUrl));
        downloadLink.setAttribute('download', '');

        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);

        downloadLink.click();

        document.body.removeChild(downloadLink);
    });

});
