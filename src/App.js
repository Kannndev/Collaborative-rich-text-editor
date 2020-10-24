import React, { useEffect } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.bubble.css';
import Sharedb from 'sharedb/lib/client';
import richText from 'rich-text';

// Registering the rich text type to make sharedb work
// with our quill editor
Sharedb.types.register(richText.type);

// Connecting to our socket server
const socket = new WebSocket('ws://127.0.0.1:8080');
const connection = new Sharedb.Connection(socket);

// Querying for our document
const doc = connection.get('documents', 'firstDocument');

function App() {
  useEffect(() => {
    doc.subscribe(function (err) {
      if (err) throw err;

      const toolbarOptions = ['bold', 'italic', 'underline', 'strike', 'align'];
      const options = {
        theme: 'bubble',
        modules: {
          toolbar: toolbarOptions,
        },
      };
      let quill = new Quill('#editor', options);
      /**
       * On Initialising if data is present in server
       * Updaing its content to editor
       */
      quill.setContents(doc.data);

      /**
       * On Text change publishing to our server
       * so that it can be broadcasted to all other clients
       */
      quill.on('text-change', function (delta, oldDelta, source) {
        if (source !== 'user') return;
        doc.submitOp(delta, { source: quill });
      });

      /** listening to changes in the document
       * that is coming from our server
       */
      doc.on('op', function (op, source) {
        if (source === quill) return;
        quill.updateContents(op);
      });
    });
    return () => {
      connection.close();
    };
  }, []);

  return (
    <div style={{ margin: '5%', border: '1px solid' }}>
      <div id='editor'></div>
    </div>
  );
}

export default App;
