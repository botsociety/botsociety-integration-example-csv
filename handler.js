const { prop } = require('ramda/src')
const Botsociety = require('botsociety')
const csv = require('csv-generate')

const triggerExport = async(event) => {
  const headers = prop('headers', event)
  const accessToken = prop('Access-Token', headers)
  const { user_id, api_key_public } = headers
  const body = JSON.parse(prop('body', event))

  const http = require('https')
  /*
    Example of the data passed in the body of the POST
    body: {
      domain,
      deviceToExport,
      welcomePathId,
      designId,
      callbackUrl,
    }
  */
  var exportCSV = function() {
    r  = new Promise(function(done, error) {
      var botsociety = new Botsociety({userId: headers.user_id, apiKey: headers.api_key_public})
      botsociety.getConversation(body.designId)
      .then(function(conversation) {
        var CSVfile = "messageId,sender,content"
        for (i = 0; i < conversation.messages.length; i++) {
          var message = conversation.messages[i]
          CSVfile += "\n"
          for (y = 0; y < Object.keys(message.attachments).length; y++ ) {
            if (message.attachments[Object.keys(message.attachments)[y]][0]) {
              var attachment = message.attachments[Object.keys(message.attachments)[y]][0]
              for (x = 0; x < attachment.items.length; x++) {
                var val = attachment.items[x].values[Object.keys(attachment.items[x].values)[0]];
                val = val[Object.keys(val)[0]];
                val = val[Object.keys(val)[0]]; //grab the first available field, regardless of the format
                CSVfile += message.id + "," + message.sender_id + "," + val
              }
            }
          }
        }
        done(CSVfile)
      })
    })
    return r;
  }
  exportCSV()
  .then(function(base64_file) {
    let buff = new Buffer(base64_file);
    let base64data = buff.toString('base64');
    console.log("CSV created")
    httpOptions = {
      hostname: "app.botsociety.io",
      port: 443,
      method: 'POST',
      path: body.callbackUrl,
      headers: {
        'Content-Type': 'application/json',
        'user_id': `${headers.userId}`,
        'api_key_public': `${headers.apiKey}`,
      }
    };
    var postData = JSON.stringify({
      file: base64data,
      file_name: 'export.csv',
      type: 'file_download'
    })
    var responseData = "";
    const req = http.request(httpOptions, (res) => {
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        responseData += chunk
      });
      res.on('end', () => {
        //done(JSON.parse(responseData))
        console.log("CSV sent")
      });
    });
    req.on('error', (e) => {
      console.error(e)
    });
    req.write(postData);
    req.end();
  })

  var statusCode = 200;
  var info = {message: "The export succeded"};
  return {
    statusCode,
    body: JSON.stringify({
      info,
    }),
  }
}

module.exports = {
  triggerExport
}