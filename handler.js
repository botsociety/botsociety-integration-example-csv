const { prop } = require('ramda/src')
const Botsociety = require('botsociety')
const csv = require('csv-generate')

const triggerExport = async (event) => {
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
  var getConversation = (conversationId, config) => {
    httpOptions = {
      hostname: config.domain,
      port: 443,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'user_id': `${config.userId}`,
        'api_key_public': `${config.apiKey}`,
      },
      path: `/designs/${conversationId}/integrations`
    }
    var promise = new Promise(function (done, error) {
      var responseData = ""
      const req = http.get(httpOptions, (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          responseData += chunk
        });
        res.on('end', () => {
          if (res.statusCode != 200) {
            return error(JSON.parse(responseData))
          } else {
            return done(JSON.parse(responseData))
          }
        });
      });
      req.on('error', (e) => {
        console.log('returning error on getConv')
        error(e)
      });
      req.end();
    })
    return promise;
  }
  var exportCSV = function () {
    r = new Promise(function (done, error) {
      getConversation(body.designId, { userId: headers.user_id, apiKey: headers.api_key_public, domain: body.domain })
        .then(function (conversation) {
          var CSVfile = "messageId,sender,intent,content,media"
          for (i = 0; i < conversation.messages.length; i++) { //loop the messages
            let message = conversation.messages[i]

            //find the sender name
            let senderi = 0;
            let personName;
            for(senderi = 0; senderi < conversation.persons.length; senderi++) {
              if (conversation.persons[senderi]._id == message.senderId) {
                personName = conversation.persons[senderi].name
              }
            }

            CSVfile += "\n"
            CSVfile += message.id + "," + personName + "," + conversation.intentsInfo[message.intentId].info.intentName + ","
            for (y = 0; y < message.attachments.length; y++) { //loop the attachments
              var attachment = message.attachments[y]
              for (z = 0; z < attachment.utterances.length; z++) { //loop the utterances
                CSVfile += '"' + renderUtterance(attachment.utterances[z]) + "\"" //content of the utterance
              }
              let firstMedia = false;
              for (z = 0; z < attachment.utterances.length; z++) { //loop the utterances again for media urls
                if (renderMedia(attachment.utterances[z]) != null) {
                  if (firstMedia == false) {
                    CSVfile += ","
                    firstMedia = true
                  }
                  CSVfile += '"' + renderMedia(attachment.utterances[z]) + "\"" //content of the media
                }
              }
            }
          }
          done(CSVfile)
        })
        .catch(function (err) {
          console.log('error exporting CSV')
          error(err)
        })
    })
    return r;
  }
  const main = new Promise(function (resolve, reject) {
    exportCSV()
      .then(function (base64_file) {
        let buff = new Buffer(base64_file);
        let base64data = buff.toString('base64');
        console.log("CSV created")
        httpOptions = {
          hostname: body.domain,
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
            var statusCode = 200;
            var info = { message: "The export succeded" };
            resolve({
              statusCode,
              body: JSON.stringify({
                info,
              }),
            })
          });
        });
        req.on('error', (e) => {
          console.log(e)
          //throw new Error(e)
        });
        req.write(postData);
        req.end();

      })
      .catch(function (err) {
        console.log("error")
        console.log(err)
        reject({
          statusCode: 500,
          body: JSON.stringify({
            err,
          }),
        })
      })
  })
  return main;
}

var renderUtterance = function(utterance) {
  var f = "";
  if (utterance.components) {
    for(rux = 0; rux < utterance.components.length; rux++) {
      if (utterance.components[rux].text) {
        f += utterance.components[rux].text
      }
    }

    for(ruxi = 0; ruxi < utterance.components.length; ruxi++) {
      if (utterance.components[ruxi].choices) {
        f = f+ " | "
        for (ruxy = 0; ruxy < utterance.components[ruxi].choices.length; ruxy++) {
          f += utterance.components[ruxi].choices[ruxy].label + " | "
        }
      }
    }
  }
  return f;  
}

var renderMedia = function(utterance) {
  var f = null;
  if (utterance.components) {
    for(rux = 0; rux < utterance.components.length; rux++) {
      if (utterance.components[rux].bsFile && utterance.components[rux].bsFile.url) {
        if (f == null) {
          f = ""
        }
        f += utterance.components[rux].bsFile.url
      }
    }
  }
  return f;  
}

module.exports = {
  triggerExport
}