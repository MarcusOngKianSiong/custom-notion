
// const fetch = require('node-fetch@2.7.0');
const fs = require('fs').promises;
const path = require('path');

require('dotenv').config();     // This sets up the .env file to make the environment variables specified within accessible
const { Client } = require("@notionhq/client")

// Initializing a client
const notion = new Client({
  auth: process.env.API_KEY,
})

// const blockID = 'High-intensity-events-e68c4f2c61f0404ead9bd50665bd1143'

/*
    Objective:
        1. List down all the blocks in the High Intensity page
            Page link: https://www.notion.so/High-intensity-events-e68c4f2c61f0404ead9bd50665bd1143?pvs=4
                Likely id: High-intensity-events-e68c4f2c61f0404ead9bd50665bd1143

        2. 
*/
  
// INCOMPLETE PAGE
async function getPageBlock(pageID){
    const blockId = 'e68c4f2c61f0404ead9bd50665bd1143';
    const response = await notion.blocks.children.list({
      block_id: blockId,
      page_size: 50,
    });
    
    const length = response.results.length;
    const resultsArray = response.results;
    const content = [];
    
    // for(let i = 0 ; i < length ; i++){
    //     console.log(response.results[i].paragraph)
    // }
}


/*
    CURRENT OUTCOME I AM WORKING WITH: 
    {
            title: '',
            url: 'https://uaited.ust.edu.tw/eventsession/cont?sid=0K079590017163884959',
            tags: [ [Object] ],
            date: { start: '2021-03-06', end: null, time_zone: null }
    }
 */
async function getTableProperties(tableID){
    console.log("ENTERING")
    // const exampleData = 'fa9e8c66be954fdebb157e492a7f3f4c'

    // Step 1: Get table data
    const outcome = await notion.databases.query({
        database_id: tableID
    })
    // console.log(outcome)
    // Step 2: Collect the key information from each item in the data base
    const length = outcome.results.length;
    const keyInformation = []
    for(let i = 0;i<length;i++){
        const currently = outcome.results[i]
        // console.log(currently)
        const arrayItemFormat = {
            title: '',
            url: '',
            tags: [],
            date: '',
        }
        
        // Item 4: Get title
        // const title = await retrievePageTitle(currently.id);
        // if(!title){
        //     continue;
        // }
        // arrayItemFormat.title = title;
        
        // Item 4: Get title using regex
        const id = currently.id;
        const url = currently.url;
        const reformatID = id.replaceAll('-',"");
        const titleRegex = new RegExp(`^https://www.notion.so/(.*)${reformatID}$`);
        const extract = titleRegex.exec(url);
        const replaceAllDashes = extract[1].replaceAll("-"," ");                        // e.g. Cyber-Defenders-Discovery-Camp-2021-
        const removeLastDash = replaceAllDashes.slice(0,replaceAllDashes.length-1);     // e.g. Cyber Defenders Discovery Camp 2021
        arrayItemFormat.title = removeLastDash;
    
        // Item 1: Get url
        arrayItemFormat.url = currently.properties.Website.url;

        // Item 2: Get tags
        arrayItemFormat.tags = currently.properties.Organization.multi_select;
        // Item 3: Get date
        arrayItemFormat.date = currently.properties.Date.date;
        
        
        // Last: Input the collected data into the array. 
        keyInformation.push(arrayItemFormat);
        // console.log(arrayItemFormat)
    }
    return keyInformation;
}



async function retrievePageData(pageID){

    /* 
    EXPECTED OUTCOME: 
    {
            object: 'page',
            id: '6f4405e1-0010-4300-af8a-8ab23c83d95e',
            created_time: '2023-11-22T10:58:00.000Z',
            last_edited_time: '2023-11-23T06:32:00.000Z',
            created_by: { object: 'user', id: '6ce77016-7de8-4b03-b0fd-565cb7054e8c' },
            last_edited_by: { object: 'user', id: '6ce77016-7de8-4b03-b0fd-565cb7054e8c' },
            cover: null,
            icon: null,
            parent: {
                type: 'database_id',
                database_id: 'fa9e8c66-be95-4fde-bb15-7e492a7f3f4c'
            },
            archived: false,
            properties: {
                Website: { id: '%3DsP%40', type: 'url', url: 'https://www.ideate2022.com/' },
                Organization: { id: '%3E%5CAI', type: 'multi_select', multi_select: [Array] },
                Date: { id: 'PvwG', type: 'date', date: null },
                'Event name': { id: 'title', type: 'title', title: [Array] }
            },
            url: 'https://www.notion.so/IDEATE-2022-6f4405e100104300af8a8ab23c83d95e',
            public_url: null,
            request_id: '206426ee-6e39-4c2c-84d7-cef535715db6'
    }
            Multi_select property: 
                [
                    {
                        id: '78ba4da9-1d42-4570-b86e-519c866aec79',
                        name: 'NUS',
                        color: 'default'
                    }
                ]
            Event name title property: 
                [
                    {
                        type: 'text',
                        text: { content: 'IDEATE 2022', link: null },
                        annotations: {
                        bold: false,
                        italic: false,
                        strikethrough: false,
                        underline: false,
                        code: false,
                        color: 'default'
                        },
                        plain_text: 'IDEATE 2022',
                        href: null
                    }
                ]
            Date property:
                [
                    { 
                        start: '2024-04-01', 
                        end: null, 
                        time_zone: null 
                    }
                ]
    */

    // THIS IS THE PAGE THAT IS IN THE DATABASE
    // const outcome = await notion.pages.retrieve({page_id: '6f4405e100104300af8a8ab23c83d95e'}) 

    // THIS IS THE PAGE THAT IS STANDALONE  ->  I DID NOT CONNECT THE INTEGRATION TO THIS PAGE THAT IS WHY IT DID NOT WORK.
    const outcome = await notion.pages.retrieve({page_id: '6f4405e100104300af8a8ab23c83d95e'}) 
    console.log(outcome.properties.Date.date)
}


// HOLY SHIT I GOT IT. 
/*
    How to change the property: 
        1. You need the data itself and all the required meta data for that specific property.
            e.g. date -> 
                - I need to specify where in the hierarchy of objects the data should be placed, -> {Date: {date: ....}}
                - I need to specify the data and the surrounding data -> { start: '2024-04-01', end: null, time_zone: null }
*/
async function changeSinglePageProperty(pageID,property,propertyData){
    await notion.pages.update({
        page_id: '6f4405e100104300af8a8ab23c83d95e', 
        properties: {
            Date: {
                date: 
                    { 
                        start: '2024-04-01', 
                        end: null, 
                        time_zone: null 
                    }
            }
        }
    })
}

// OKAY, The goal is to look through a bunch of dates and attach it to the various pages in the database
function extractData(){
    fs.readFile('')
}

/*
    Steps: 
        1. Loop through the various dates in the database. 
            - 
        
        2. Loop through the id of the various pages in the database.
            - 
        3. Run pages.update on each id and change the date.
            

*/

async function getDatabaseMetaData(database_id){
    const tableMetaData = await notion.databases.retrieve({database_id: database_id});
    return tableMetaData;
}

async function getAllDatabaseItems(id){
    const outcome = await notion.databases.query({
        database_id: id
    })
    return outcome;
}

async function populate() {

    // Step 1: Gather all the data in one place
    const fileContent = await fs.readFile(path.join(__dirname, "..", "Basic-webpage-scrapper", "list.txt"), 'utf8');
    const tableData = await notion.databases.query({database_id: 'fa9e8c66be954fdebb157e492a7f3f4c'});

    // Step 2: Extract/convert the necessary 
    const splitByNewLine = fileContent.split('\n');
    const tableItems = {}
    tableData.results.forEach(obj => {
        const itemName = obj.properties["Event name"].title[0].text.content;
        const id = obj.id.replaceAll("-","");
        tableItems[itemName] = id;
    });

    // Step 3: Loop through the list, find the id, change the date
    const length = splitByNewLine.length;
    for(let i = 0;i<length;i++){
        const current = splitByNewLine[i];
        const splitByComma = current.split(",");
        const pageID = tableItems[splitByComma[0]];
        // Index 0 is the title, index 1 is the date
        
        console.log(splitByComma[0]," -> ", splitByComma[1], " -> ",tableItems[splitByComma[0]]);
        await notion.pages.update({
            page_id: pageID,
            properties: {
                        Date: {
                            date: {
                                start: splitByComma[1], 
                                end: null, 
                                time_zone: null 
                            }
                        }
                    }
        })
        
        
    }
    
    // const length = dbItemsID.length;
    

    // Step 3: Go through each database item id to change the date
    // for(let i = 0;i<length;i++){
        // console.log(ISOFormat[i], names[i])
        
        // await notion.pages.update({
        //     page_id: dbItemsID[i],
        //     properties: {
        //         Date: {
        //             date: {
        //                 start: isoDateString, 
        //                 end: null, 
        //                 time_zone: null 
        //             }
        //         }
        //     }
        // })
    // }
    
    // console.log(tableData);
}




// retrievePageData('6f4405e100104300af8a8ab23c83d95e');
// changeSinglePageProperty('x','x','x');
// retrievePageData('x');
populate()



/* 

    Another approach:
        Strategy: 
            1. Loop through the ordered list of names, 
            2. find the match between names (ordered list and notion database), 
            3. then add the date 
*/