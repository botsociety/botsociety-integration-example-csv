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
        var CSVfile = "messageId,sender,intent,content"
        for (i = 0; i < conversation.messages.length; i++) { //loop the messages
          var message = conversation.messages[i]
          CSVfile += "\n"
          CSVfile += message.id + "," + message.sender_id + ","
          for (y = 0; y < message.attachments.length; y++ ) { //loop the attachments
            var attachment = message.attachments[y]
            for (z = 0; z < attachment.utterances.length; z++ ) { //loop the utterances
              CSVfile += JSON.stringify(attachment.utterances[z]) + "," //content of the first utterance
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
        'user_id': `${headers.user_id}`,
        'api_key_public': `${headers.api_key_public}`,
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