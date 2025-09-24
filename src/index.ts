// index.ts
import express from "express";
import { poolPromise, sql } from "./sqlcon"; // Import the poolPromise and sql
import cors from "cors";
import dotenv from "dotenv";
dotenv.config(); // Load environment variables from .env file
const apiKey = process.env.APP_MY_API_KEY; // Retrieve the environment variable
console.log("API Key:", apiKey); // Use the environment variable as needed
import verifyToken from "./verifyToken"; // Import the verifyToken middleware
import { generateToken, generateRefreshToken, isTokenExpired, refreshAccessToken, generateRefreshToken1, } from "./generatetoken"; // Import the generateToken function
import { UserResultSet, DecodedUser } from "./generatetoken";
import jwt from "jsonwebtoken";
const AWS = require("aws-sdk");
const app: express.Application = express();
const port = 3003;
app.use(cors()); // Enables CORS for all origins
app.use(express.json());
import moment from "moment-timezone";
import { json } from "stream/consumers";
import { DateTime } from "mssql";
const crypto = require('crypto');

app.get("/", (req: express.Request, res: express.Response) => {
  res.status(200).send("Hello World! " + apiKey);
});



AWS.config.update({
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
  region: process.env.region,
});


// ✅ Create DocumentClient with local endpoint
const dynamo = new AWS.DynamoDB.DocumentClient({
  endpoint: "https://dynamodb.us-east-1.amazonaws.com",
});
const dynamoRaw = new AWS.DynamoDB({
  endpoint: "https://dynamodb.us-east-1.amazonaws.com",
});

// Getting routing profile
app.get("/api/Routingprofile", verifyToken, async (req, res) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
  } = req.query;
  try {

    const timezone: any = req.query.timezone;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const nextToken = req.query.nextToken ? JSON.parse(decodeURIComponent(req.query.nextToken as string)) : null;
    const allTimezones = moment.tz.names();
    const tz: any = allTimezones.includes(timezone) ? timezone : "Asia/Kolkata";

    const params: any = {
      TableName: 'TblmstRoutingProfile',
      Limit: pageSize,
    };

    // ✅ If sval is provided, split by comma and filter usernames
    if (sval) {
      const values = (sval as string).split(",").map((v) => v.trim());
      // build placeholders like :u0, :u1, ...
      params.FilterExpression = `#Names IN (${values.map((_, i) => `:u${i}`).join(", ")})`;
      params.ExpressionAttributeNames = {
        "#Names": "Names",
      };
      params.ExpressionAttributeValues = values.reduce((acc, v, i) => {
        acc[`:u${i}`] = v;
        return acc;
      }, {} as any);
    }

    if (nextToken) {
      params.ExclusiveStartKey = nextToken; // DynamoDB continuation
    }
    const data = await dynamo.scan(params).promise();
    if (!data.Items || data.Items.length === 0) {
      return res.status(200).json({ message: "No records found" });
    }
    const mergedData: any = {};
    data.Items.forEach((item: any) => {
      const contactId = item.UUID;
      if (!mergedData[contactId]) {
        mergedData[contactId] = {
          id: contactId,
          UUID: contactId,
          Names: null,
          Isactive: 'Active',
          val: null,
        };
      }
      if (item?.ContactId) mergedData[contactId].id = item.UUID;
      if (item?.Names) mergedData[contactId].Names = item.Names;
      if (item?.ContactId) mergedData[contactId].UUID = item.UUID;
      if (item?.Isactive) mergedData[contactId].Isactive = item.IsActive;

    });

    const result = Object.values(mergedData);

    res.status(200).json([
      result,
      [{ count: result.length }],
      result,
      {
        nextToken: data.LastEvaluatedKey
          ? encodeURIComponent(JSON.stringify(data.LastEvaluatedKey))
          : null
      }
    ]);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// get distinct names for dropdown
app.get("/api/dropRoutingprofile", verifyToken, async (req, res) => {
  try {
    const timezone: any = req.query.timezone;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const nextToken = req.query.nextToken ? JSON.parse(decodeURIComponent(req.query.nextToken as string)) : null;
    const allTimezones = moment.tz.names();
    const tz: any = allTimezones.includes(timezone) ? timezone : "Asia/Kolkata";

    const params: any = {
      TableName: 'TblmstRoutingProfile',
      Limit: pageSize,
    };

    if (nextToken) {
      params.ExclusiveStartKey = nextToken; // DynamoDB continuation
    }

    const data = await dynamo.scan(params).promise();

    if (!data.Items || data.Items.length === 0) {
      return res.status(200).json({ message: "No records found" });
    }

    const mergedData: any = {};

    data.Items.forEach((item: any) => {
      const contactId = item.UUID;

      if (!mergedData[contactId]) {
        mergedData[contactId] = {
          Names: null
        };
      }
      if (item?.Names) mergedData[contactId].Names = item.Names;

    });
    const result = Object.values(mergedData);
    res.status(200).json([result]);

  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
//Getitng the userdata
app.get("/api/Usermanagement", verifyToken, async (req, res) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
  } = req.query;

  try {
    const timezone: any = req.query.timezone;
    const pageSize = parseInt(req.query.pageSize as string) || 100;
    const nextToken = req.query.nextToken ? JSON.parse(decodeURIComponent(req.query.nextToken as string)) : null;
    const allTimezones = moment.tz.names();
    const tz: any = allTimezones.includes(timezone) ? timezone : "Asia/Kolkata";

    const params: any = {
      TableName: 'TblmstAgentSummary',
      Limit: pageSize,
    };

    if (nextToken) {
      params.ExclusiveStartKey = nextToken; // DynamoDB continuation
    }

    // ✅ If sval is provided, split by comma and filter usernames
    if (sval) {
      const values = (sval as string).split(",").map((v) => v.trim());

      // build placeholders like :u0, :u1, ...
      params.FilterExpression = `#Username IN (${values.map((_, i) => `:u${i}`).join(", ")})`;

      params.ExpressionAttributeNames = {
        "#Username": "Username",
      };

      params.ExpressionAttributeValues = values.reduce((acc, v, i) => {
        acc[`:u${i}`] = v;
        return acc;
      }, {} as any);
    }

    const data = await dynamo.scan(params).promise();

    if (!data.Items || data.Items.length === 0) {
      return res.status(200).json({ message: "No records found" });
    }

    const mergedData: any = {};

    data.Items.forEach((item: any) => {
      const contactId = item.UUID;

      if (!mergedData[contactId]) {
        mergedData[contactId] = {
          id: contactId,
          Agentstate: '',
          UUID: contactId,
          Login: null,
          "Name (Last,First)": null,
          "Routing profile": null,
          "Security profile": null,
          "Agent hierarchy": null,
          "ACW timeout": null,
          "Phone type": null,
          "Auto accept calls": null,
          "Desk phone number": null,
          "Tags": null,
          "rn": null,
          "val": null

        };
      }
      const toTZ = (utcTime: any) =>
        utcTime ? moment(utcTime).tz(tz).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]") : null;

      if (item.UUID) mergedData[contactId].UUID = item.UUID;
      if (item.Username) mergedData[contactId].Login = item.Username;
      if (item.FirstName) mergedData[contactId]["Name (Last,First)"] = item.FirstName + item.LastName;
      if (item.RoutingProfileId) mergedData[contactId]["Routing profile"] = item.RoutingProfileId;
      if (item.FirstName) mergedData[contactId]["Security profile"] = item.SecurityProfileIds;
      if (item.FirstName) mergedData[contactId]["Agent hierarchy"] = item.HierarchyGroupId;
      if (item.FirstName) mergedData[contactId]["ACW timeout"] = item.AfterContactWorkTimeLimit;
      if (item.FirstName) mergedData[contactId]["Phone type"] = item.PhoneType;
      if (item.FirstName) mergedData[contactId]["Auto accept calls"] = item.AutoAccept;
      if (item.FirstName) mergedData[contactId]["Tags"] = '';
      if (item.FirstName) mergedData[contactId]["rn"] = '';

    });

    const result = Object.values(mergedData);

    res.status(200).json([
      result,
      [{ count: result.length }],
      result,
      {
        nextToken: data.LastEvaluatedKey
          ? encodeURIComponent(JSON.stringify(data.LastEvaluatedKey))
          : null
      }
    ]);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
app.get("/api/dropUsermanagement", verifyToken, async (req, res) => {
  try {
    const timezone: any = req.query.timezone;
    const pageSize = parseInt(req.query.pageSize as string) || 100;
    const nextToken = req.query.nextToken ? JSON.parse(decodeURIComponent(req.query.nextToken as string)) : null;
    const allTimezones = moment.tz.names();
    const tz: any = allTimezones.includes(timezone) ? timezone : "Asia/Kolkata";

    const params: any = {
      TableName: 'TblmstAgentSummary',
      Limit: pageSize,
    };

    if (nextToken) {
      params.ExclusiveStartKey = nextToken; // DynamoDB continuation
    }

    const data = await dynamo.scan(params).promise();

    if (!data.Items || data.Items.length === 0) {
      return res.status(200).json({ message: "No records found" });
    }

    const mergedData: any = {};

    data.Items.forEach((item: any) => {
      const contactId = item.UUID;

      if (!mergedData[contactId]) {
        mergedData[contactId] = {
          Login: null,
        };
      }
      const toTZ = (utcTime: any) =>
        utcTime ? moment(utcTime).tz(tz).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]") : null;
      if (item.Username) mergedData[contactId].Login = item.Username;
    });
    const result = Object.values(mergedData);
    res.status(200).json([result]);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
app.get("/api/Loginoutreport1", verifyToken, async (req: any, res: any) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
    queueid = null,
    agentsearch = null,
  } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(
    //     `Exec usp_getAgentReport ${currentPage},${perPage},${searchText !== null ? "'" + searchText + "'" : "NULL"
    //     },${sval !== null ? "'" + sval + "'" : "NULL"},${queueid !== null ? "'" + queueid + "'" : "NULL"
    //     },${agentsearch !== null ? "'" + agentsearch + "'" : "NULL"}`
    //   );
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);

    const { PageNo = 1, RowCountPerPage = 15 } = req.query;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Fetch data from Dynamo
    const agentSummary = await dynamo.scan({ TableName: "TblmstAgentSummary" }).promise();
    //const agentCallCount = await dynamo.scan({ TableName: "TbltrnHistoricalAgent" }).promise();
    const agentActivity = await dynamo.scan({ TableName: "TbltrnAgentActivity" }).promise();

    const agentCallCount = await dynamo.scan({
      TableName: "TbltrnHistoricalAgent",
      FilterExpression: "begins_with(StartTime, :today)",
      ExpressionAttributeValues: {
        ":today": today
      }
    }).promise();

    // ✅ Filter active agents

    const activeAgentIds = new Set(
      agentActivity.Items.filter((a: any) => {
        if (!a.Duration) return false;
        const loginDate = new Date(a.Duration + "Z");
        //const loginDate = new Date(a.Duration).toISOString().slice(0, 10);

        // condition: logged in today AND (no logout OR logout still null)
        return loginDate.toISOString().slice(0, 10) === today && (!a.LogoutTime || a.LogoutTime === null);
      }).map((a: any) => a.UUID)
    );

    // Helpers
    const formatDateTime = (d: Date) =>
      d.toISOString().slice(0, 19).replace("T", " ");
    const formatDuration = (ms: number) => {
      const sec = Math.floor(ms / 1000);
      const h = String(Math.floor(sec / 3600)).padStart(2, "0");
      const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
      const s = String(sec % 60).padStart(2, "0");
      return `${h}:${m}:${s}`;
    };

    // Build report only for active agents
    const report = agentSummary.Items
      .filter((a: any) => activeAgentIds.has(a.UUID)) // ✅ only active agents
      .map((a: any) => {
        const countRow = agentCallCount.Items.find((c: any) => c.Agentid === a.UUID);
        const activityRow = agentActivity.Items.find((c: any) => c.UUID === a.UUID);

        let STATUS = "OFFLINE";
        let STATUS2 = "OFFLINE";
        let STATUS3 = "Idle";

        if (activityRow.Activity === "Available") {
          STATUS = "LOGGEDIN";
          // STATUS2 = "AVAILABLE";
          STATUS2 = activityRow.AgentState === "CONNECTED" ? "Busy" : activityRow.AgentState === "CONNECTING" ? "AVAILABLE" : activityRow.AgentState === "CONNECTED_ONHOLD" ? "ONHOLD" : "AVAILABLE";
          STATUS3 = activityRow.AgentState === "CONNECTED" ? "ONCALL" : activityRow.AgentState === "CONNECTING"
            ? "IDLE"
            : activityRow.AgentState === "CONNECTED_ONHOLD"
              ? "ONHOLD"
              : "IDLE";
        }
        else if (activityRow.Activity === "Training") {
          STATUS = "LOGGEDIN";
          STATUS2 = "Training";
          STATUS3 =
            a.AgentState === "CONNECTED"
              ? "ONCALL"
              : a.AgentState === "CONNECTING"
                ? "IDLE"
                : a.AgentState === "CONNECTED_ONHOLD"
                  ? "ONHOLD"
                  : "IDLE";
        }
        else if (activityRow.Activity === "Meeting") {
          STATUS = "LOGGEDIN";
          STATUS2 = "Meeting";
          STATUS3 =
            a.AgentState === "CONNECTED"
              ? "ONCALL"
              : a.AgentState === "CONNECTING"
                ? "IDLE"
                : a.AgentState === "CONNECTED_ONHOLD"
                  ? "ONHOLD"
                  : "IDLE";
        }
        else if (activityRow.Activity === "Lunch") {
          STATUS = "LOGGEDIN";
          STATUS2 = "Lunch";
          STATUS3 =
            a.AgentState === "CONNECTED"
              ? "ONCALL"
              : a.AgentState === "CONNECTING"
                ? "IDLE"
                : a.AgentState === "CONNECTED_ONHOLD"
                  ? "ONHOLD"
                  : "IDLE";
        }
        else if (activityRow.Activity === "Break") {
          STATUS = "LOGGEDIN";
          STATUS2 = "Break";
          STATUS3 =
            a.AgentState === "CONNECTED"
              ? "ONCALL"
              : a.AgentState === "CONNECTING"
                ? "IDLE"
                : a.AgentState === "CONNECTED_ONHOLD"
                  ? "ONHOLD"
                  : "IDLE";
        }

        const totalCalls = countRow ? countRow.CONTACTS_CREATED : 0;
        const handledCalls = countRow ? countRow.CONTACTS_HANDLED : 0;
        const abandonedCalls = countRow ? countRow.CONTACTS_ABANDONED : 0;
        const avgHandleTime =
          countRow && handledCalls > 0
            ? (countRow.SUM_HANDLE_TIME / handledCalls).toFixed(0)
            : 0;

        const loginTime = activityRow.Duration ? activityRow.Duration : null;
        const logoutTime = STATUS2 === "AVAILABLE" ? null : formatDateTime(new Date());
        const duration =
          loginTime && logoutTime
            ? formatDuration(
              new Date(logoutTime).getTime() - new Date(loginTime).getTime()
            )
            : null;

        return {
          LoginTime: loginTime ? formatDateTime(new Date(loginTime)) : null,
          AgentID: a.Username,
          AgentName: `${a.FirstName} ${a.LastName}`,
          routingProfile: a.RoutingProfileId,
          logoutTime,
          Duration: duration,
          callTaken: `${handledCalls} <i class="fas fa-comment" style="color: rgb(38, 198, 218);"></i> | ${totalCalls} <i class="fa fa-phone" style="color: rgb(38, 198, 218);"></i>`,
          callaban: `${abandonedCalls} <i class="fas fa-comment" style="color: rgb(38, 198, 218);"></i> | ${abandonedCalls} <i class="fa fa-phone" style="color: rgb(38, 198, 218);"></i>`,
          AHT: `${avgHandleTime} <i class="fas fa-comment" style="color: rgb(38, 198, 218);"></i> | ${avgHandleTime} <i class="fa fa-phone" style="color: rgb(38, 198, 218);"></i>`,
          status: STATUS,
          ONLINE_STATE: STATUS2,
          CONTACT_STATE: STATUS3,
        };
      });

    // Pagination
    const page = parseInt(PageNo);
    const limit = parseInt(RowCountPerPage);
    const start = (page - 1) * limit;
    const paginated = report.slice(start, start + limit);

    res.json([paginated, [{ count: report.length }]]);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
//Getitng the queueReport
app.get("/api/queueReport", verifyToken, async (req, res) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
  } = req.query;
  try {
    const timezone: any = req.query.timezone;
    const pageSize = parseInt(req.query.pageSize as string) || 100;
    const nextToken = req.query.nextToken ? JSON.parse(decodeURIComponent(req.query.nextToken as string)) : null;
    const allTimezones = moment.tz.names();
    const tz: any = allTimezones.includes(timezone) ? timezone : "Asia/Kolkata";

    const params: any = {
      TableName: 'TblmstQueue',
      Limit: pageSize,
      FilterExpression: "attribute_exists(#n) AND #n <> :empty",
      ExpressionAttributeNames: {
        "#n": "Names"
      },
      ExpressionAttributeValues: {
        ":empty": ""
      }
    };

    // ✅ If sval is provided, split by comma and filter usernames
    if (sval) {
      const values = (sval as string).split(",").map((v) => v.trim());
      // build placeholders like :u0, :u1, ...
      params.FilterExpression = `#Names IN (${values.map((_, i) => `:u${i}`).join(", ")})`;
      params.ExpressionAttributeNames = {
        "#Names": "Names",
      };
      params.ExpressionAttributeValues = values.reduce((acc, v, i) => {
        acc[`:u${i}`] = v;
        return acc;
      }, {} as any);
    }
    if (nextToken) {
      params.ExclusiveStartKey = nextToken; // DynamoDB continuation
    }
    const data = await dynamo.scan(params).promise();
    if (!data.Items || data.Items.length === 0) {
      return res.status(200).json({ message: "No records found" });
    }
    const mergedData: any = {};
    data.Items.forEach((item: any) => {
      const contactId = item.UUID;
      if (!mergedData[contactId]) {
        mergedData[contactId] = {
          id: null,
          UUID: null,
          Names: null,
          QueueType: null,
          Isactive: 'Active',
          val: null,
        };
      }
      const toTZ = (utcTime: any) =>
        utcTime ? moment(utcTime).tz(tz).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]") : null;
      if (item.UUID) mergedData[contactId].id = item.UUID;
      if (item.UUID) mergedData[contactId].UUID = item.UUID;
      if (item.Names) mergedData[contactId].Names = item.Names;
      if (item.QueueType) mergedData[contactId].QueueType = item.QueueType;
      if (item.val) mergedData[contactId].val = item.val;
      // if (item?.Isactive) mergedData[contactId].Isactive = item?.Isactive;
    });

    const result = Object.values(mergedData);
    res.status(200).json([
      result,
      [{ count: result.length }],
      result,
      {
        nextToken: data.LastEvaluatedKey
          ? encodeURIComponent(JSON.stringify(data.LastEvaluatedKey))
          : null
      }
    ]);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// for dropdown
app.get("/api/dropqueueReport", verifyToken, async (req, res) => {
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool.request().query(`Exec usp_get_queueReport_drop`);
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);
    const timezone: any = req.query.timezone;
    const pageSize = parseInt(req.query.pageSize as string) || 100;
    const nextToken = req.query.nextToken ? JSON.parse(decodeURIComponent(req.query.nextToken as string)) : null;
    const allTimezones = moment.tz.names();
    const tz: any = allTimezones.includes(timezone) ? timezone : "Asia/Kolkata";

    const params: any = {
      TableName: 'TblmstQueue',
      Limit: pageSize,
      FilterExpression: "attribute_exists(#n) AND #n <> :empty",
      ExpressionAttributeNames: {
        "#n": "Names"
      },
      ExpressionAttributeValues: {
        ":empty": ""
      }
    };

    if (nextToken) {
      params.ExclusiveStartKey = nextToken; // DynamoDB continuation
    }

    const data = await dynamo.scan(params).promise();

    if (!data.Items || data.Items.length === 0) {

      //  return res.status(200).json({ message: "No records found" });
      return res.status(200).json([
        data,
        [{ count: data.length }],
        data,
        {
          nextToken: data.LastEvaluatedKey
            ? encodeURIComponent(JSON.stringify(data.LastEvaluatedKey))
            : null
        }
      ]);
    }
    const mergedData: any = {};

    data.Items.forEach((item: any) => {
      const contactId = item.UUID;

      if (!mergedData[contactId]) {
        mergedData[contactId] = {
          Names: null,
          qid: null,
          val: null,
        };
      }

      const toTZ = (utcTime: any) =>
        utcTime ? moment(utcTime).tz(tz).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]") : null;
      if (item.UUID) mergedData[contactId].qid = item.UUID;
      if (item.Names) mergedData[contactId].Names = item.Names;
      if (item.val) mergedData[contactId].val = item.val;
      // if (item?.Isactive) mergedData[contactId].Isactive = item?.Isactive;

    });
    const result = Object.values(mergedData);
    res.status(200).json([result]);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
//Getitng the metricQUEUEREPORT
app.get("/api/metricQUEUEREPORT", verifyToken, async (req: any, res: any) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
    fromdate = null,
    todate = null,
    queueid = null,
  } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(
    //     `Exec USP_h_QUEUE_REPORT ${currentPage},${perPage},${searchText !== null ? "'" + searchText + "'" : "NULL"
    //     },${sval !== null ? "'" + sval + "'" : "NULL"},${fromdate !== null ? "'" + fromdate + "'" : "NULL"
    //     },${todate !== null ? "'" + todate + "'" : "NULL"},${queueid !== null ? "'" + queueid + "'" : "NULL"
    //     }`
    //   );
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);
    const pageSize = 500;
    const params: any = {
      TableName: "TbltrnHistoricalQueue",
      Limit: pageSize,
    };

    let allItems: any[] = [];
    let lastKey = null;

    // ✅ Scan all records (you can optimize with GSI/partition key if available)
    do {
      if (lastKey) params.ExclusiveStartKey = lastKey;
      const data = await dynamo.scan(params).promise();
      allItems = [...allItems, ...(data.Items || [])];
      lastKey = data.LastEvaluatedKey;
    } while (lastKey);

    // ✅ Filter by date
    let filtered = allItems.filter((i: any) => {
      if (!i.StartTime) return false;
      const st = moment(i.StartTime);
      return (
        (!fromdate || st.isSameOrAfter(moment(fromdate))) &&
        (!todate || st.isSameOrBefore(moment(todate)))
      );
    });

    // ✅ QueueId filter
    if (queueid) {
      const queues = queueid.split(",");
      filtered = filtered.filter((i: any) => queues.includes(i.queue_id || ""));
    }

    // ✅ Queue Name filter
    if (sval) {
      const names = sval.split(",");
      filtered = filtered.filter((i: any) => names.includes(i.Names || ""));
    }

    // ✅ Group by queue_id
    const grouped: Record<string, any> = {};
    filtered.forEach((i: any) => {
      const qid = i.queue_id;
      if (!grouped[qid]) {
        grouped[qid] = {
          queueArn: qid,
          id: qid,
          Names: i.Names || "Unknown",
          CONTACTS_HANDLED: 0,
          CONTACTS_ABANDONED: 0,
          CONTACTS_QUEUED: 0,
          CONTACTS_ON_HOLD_AGENT_DISCONNECT: 0,
          CONTACTS_ON_HOLD_CUSTOMER_DISCONNECT: 0,
          CONTACTS_HOLD_ABANDONS: 0,
          CONTACTS_TRANSFERRED_OUT_FROM_QUEUE: 0,
          SUM_AVG_HANDLE: 0,
          SUM_AVG_HOLD: 0,
          SUM_AVG_INTERACTION: 0,
          SUM_AVG_AFTER_CONTACT: 0,
          SUM_AVG_ABANDON: 0,
          SUM_AVG_QUEUE_ANSWER: 0,
          StartTime: i.StartTime,
          EndTime: i.EndTime,
        };
      }
      const g = grouped[qid];
      g.CONTACTS_HANDLED += Number(i.CONTACTS_HANDLED || 0);
      g.CONTACTS_ABANDONED += Number(i.CONTACTS_ABANDONED || 0);
      g.CONTACTS_QUEUED += Number(i.CONTACTS_QUEUED || 0);
      g.CONTACTS_ON_HOLD_AGENT_DISCONNECT += Number(i.CONTACTS_ON_HOLD_AGENT_DISCONNECT || 0);
      g.CONTACTS_ON_HOLD_CUSTOMER_DISCONNECT += Number(i.CONTACTS_ON_HOLD_CUSTOMER_DISCONNECT || 0);
      g.CONTACTS_HOLD_ABANDONS += Number(i.CONTACTS_HOLD_ABANDONS || 0);
      g.CONTACTS_TRANSFERRED_OUT_FROM_QUEUE += Number(i.CONTACTS_TRANSFERRED_OUT_FROM_QUEUE || 0);

      // weighted sums like SQL
      g.SUM_AVG_HANDLE += Number(i.AVG_HANDLE_TIME || 0) * Number(i.CONTACTS_HANDLED || 0);
      g.SUM_AVG_HOLD += Number(i.AVG_HOLD_TIME || 0) * Number(i.CONTACTS_HANDLED || 0);
      g.SUM_AVG_INTERACTION += Number(i.AVG_INTERACTION_TIME || 0) * Number(i.CONTACTS_HANDLED || 0);
      g.SUM_AVG_AFTER_CONTACT += Number(i.AVG_AFTER_CONTACT_WORK_TIME || 0) * Number(i.CONTACTS_HANDLED || 0);
      g.SUM_AVG_ABANDON += Number(i.AVG_ABANDON_TIME || 0) * Number(i.CONTACTS_ABANDONED || 0);
      g.SUM_AVG_QUEUE_ANSWER += Number(i.AVG_QUEUE_ANSWER_TIME || 0) * Number(i.CONTACTS_HANDLED || 0);

      // update min/max times
      g.StartTime = moment.min(moment(g.StartTime), moment(i.StartTime));
      g.EndTime = moment.max(moment(g.EndTime), moment(i.EndTime));
    });

    const queueUUIDs = new Set<string>();
    Object.values(grouped).forEach((item: any) => {
      if (item.queueArn) queueUUIDs.add(item.queueArn);
    });

    let queues: Record<string, any> = {};
    if (queueUUIDs.size > 0) {
      const queueParams = {
        RequestItems: {
          TblmstQueue: {
            Keys: Array.from(queueUUIDs).map((uuid) => ({ UUID: uuid }))
          }
        }
      };
      const queueData = await dynamo.batchGet(queueParams).promise();
      queueData.Responses?.TblmstQueue?.forEach((q: any) => {
        queues[q.UUID] = { Names: q.Names };
      });
    }


    // Merge results back
    Object.values(grouped).forEach((item: any) => {
      if (item.queueArn && queues[item.queueArn]) {
        item.Names = queues[item.queueArn].Names;
      }
    });

    // ✅ Format results like SQL
    let result = Object.values(grouped).map((g: any) => {
      return {
        id: g.id,
        Names: g.Names,
        AbandonRate:
          (g.CONTACTS_HANDLED + g.CONTACTS_ABANDONED) === 0
            ? 0
            : (
              (g.CONTACTS_ABANDONED /
                (g.CONTACTS_HANDLED + g.CONTACTS_ABANDONED)) *
              100
            ).toFixed(2),
        AVG_HANDLE_TIME: g.CONTACTS_HANDLED
          ? formatTime(g.SUM_AVG_HANDLE / g.CONTACTS_HANDLED)
          : "00:00:00",
        AVG_HOLD_TIME: g.CONTACTS_HANDLED
          ? formatTime(g.SUM_AVG_HOLD / g.CONTACTS_HANDLED)
          : "00:00:00",
        AVG_INTERACTION_TIME: g.CONTACTS_HANDLED
          ? formatTime(g.SUM_AVG_INTERACTION / g.CONTACTS_HANDLED)
          : "00:00:00",
        AVG_AFTER_CONTACT_WORK_TIME: g.CONTACTS_HANDLED
          ? formatTime(g.SUM_AVG_AFTER_CONTACT / g.CONTACTS_HANDLED)
          : "00:00:00",
        AVG_ABANDON_TIME: g.CONTACTS_ABANDONED
          ? formatTime(g.SUM_AVG_ABANDON / g.CONTACTS_ABANDONED)
          : "00:00:00",
        AVG_QUEUE_ANSWER_TIME: g.CONTACTS_HANDLED
          ? formatTime(g.SUM_AVG_QUEUE_ANSWER / g.CONTACTS_HANDLED)
          : "00:00:00",
        CONTACTS_HANDLED: g.CONTACTS_HANDLED,
        CONTACTS_ABANDONED: g.CONTACTS_ABANDONED,
        CONTACTS_QUEUED: g.CONTACTS_QUEUED,
        CONTACTS_ON_HOLD_AGENT_DISCONNECT: g.CONTACTS_ON_HOLD_AGENT_DISCONNECT,
        CONTACTS_ON_HOLD_CUSTOMER_DISCONNECT: g.CONTACTS_ON_HOLD_CUSTOMER_DISCONNECT,
        CONTACTS_HOLD_ABANDONS: g.CONTACTS_HOLD_ABANDONS,
        CONTACTS_TRANSFERRED_OUT_FROM_QUEUE: g.CONTACTS_TRANSFERRED_OUT_FROM_QUEUE,
        StartTime: g.StartTime,
        EndTime: g.EndTime,
      };
    });

    // ✅ Search filter (like SQL @Search)
    if (searchText) {
      const s = String(searchText).toLowerCase();
      result = result.filter(
        (i: any) =>
          (i.Names && i.Names.toLowerCase().includes(s)) ||
          (i.AVG_HANDLE_TIME && i.AVG_HANDLE_TIME.includes(s)) ||
          (i.AVG_HOLD_TIME && i.AVG_HOLD_TIME.includes(s))
      );
    }

    // ✅ Sort by Names ASC
    result = result.sort((a: any, b: any) =>
      (a.Names || "").localeCompare(b.Names || "")
    );

    // ✅ Pagination
    const start = (Number(currentPage + 1) - 1) * Number(perPage);
    const paginated = result.slice(start, start + Number(perPage));

    // ✅ Final response (like SQL: page, count, full)
    res.status(200).json([
      paginated,
      [{ count: result.length }],
      result
    ]);

    function formatTime(seconds: any) {
      if (!seconds || isNaN(seconds)) return "00:00:00";
      seconds = Math.floor(seconds);
      const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
      const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
      const s = Math.floor(seconds % 60).toString().padStart(2, "0");
      return `${h}:${m}:${s}`;
    }
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// //for dropdown
app.get('/api/dropmetricQUEUEREPORT', verifyToken, async (req, res) => {
  const { queue = null } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log('Connected to the database.');
    // const result = await pool.request().query(`Exec usp_get_queueReport_drop ${queue !== null ? "'" + queue + "'" : 'NULL'}`);
    // console.log('SQL query executed successfully.');
    // res.json(result.recordsets);
    const timezone: any = req.query.timezone;
    const pageSize = parseInt(req.query.pageSize as string) || 100;
    const nextToken = req.query.nextToken ? JSON.parse(decodeURIComponent(req.query.nextToken as string)) : null;
    const allTimezones = moment.tz.names();
    const tz: any = allTimezones.includes(timezone) ? timezone : "Asia/Kolkata";
    const params: any = {
      TableName: 'TblmstQueue',
      Limit: pageSize,
      FilterExpression: "attribute_exists(#n) AND #n <> :empty",
      ExpressionAttributeNames: {
        "#n": "Names"
      },
      ExpressionAttributeValues: {
        ":empty": ""
      }
    };
    if (nextToken) {
      params.ExclusiveStartKey = nextToken;
    }
    const data = await dynamo.scan(params).promise();
    if (!data.Items || data.Items.length === 0) {
      return res.status(200).json({ message: "No records found" });
    }
    const mergedData: any = {};
    data.Items.forEach((item: any) => {
      const contactId = item.UUID;
      if (!mergedData[contactId]) {
        mergedData[contactId] = {
          Names: null,
          qid: null,
          val: null,
        };
      }
      const toTZ = (utcTime: any) =>
        utcTime ? moment(utcTime).tz(tz).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]") : null;
      if (item.UUID) mergedData[contactId].qid = item.UUID;
      if (item.Names) mergedData[contactId].Names = item.Names;
      if (item.val) mergedData[contactId].val = item.val;
      // if (item?.Isactive) mergedData[contactId].Isactive = item?.Isactive;
    });
    const result = Object.values(mergedData);
    res.status(200).json([result]);
  } catch (error) {
    console.error('Error executing SQL query:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error });
  } finally {
    console.log('Closing the database connection.');
  }
});
//Getitng the metricAGENTREPORT
app.get("/api/metricAGENTREPORT", verifyToken, async (req: any, res: any) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
    fromdate = null,
    todate = null,
    queueid = null,
  } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(
    //     `Exec USP_his_AGENT_REPORT  ${currentPage},${perPage},${searchText !== null ? "'" + searchText + "'" : "NULL"
    //     },${sval !== null ? "'" + sval + "'" : "NULL"},${fromdate !== null ? "'" + fromdate + "'" : "NULL"
    //     },${todate !== null ? "'" + todate + "'" : "NULL"},${queueid !== null ? "'" + queueid + "'" : "NULL"
    //     }`
    //   );
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);

    const pageSize = 500; // scan in batches
    const params: any = {
      TableName: "TbltrnHistoricalAgent",
      Limit: pageSize
    };

    let allItems: any[] = [];
    let lastKey = null;
    // ✅ Full table scan with pagination (to gather all rows in range)
    do {
      if (lastKey) params.ExclusiveStartKey = lastKey;
      const data = await dynamo.scan(params).promise();
      allItems = [...allItems, ...(data.Items || [])];
      lastKey = data.LastEvaluatedKey;
    } while (lastKey);

    // ✅ Filter by date range
    let filtered = allItems.filter((i: any) => {
      if (!i.StartTime) return false;
      const st = moment(i.StartTime);
      return (
        (!fromdate || st.isSameOrAfter(moment(fromdate))) &&
        (!todate || st.isSameOrBefore(moment(todate)))
      );
    });

    // // ✅ Queue filter
    // if (queueid) {
    //   const queues = queueid.split(",");
    //   filtered = filtered.filter((i: any) =>
    //     queues.includes(i.QueueId || "")
    //   );
    // }

    // // ✅ Username filter
    // if (sval) {
    //   const users = sval.split(",");
    //   filtered = filtered.filter((i: any) =>
    //     users.includes(i.Username || "")
    //   );
    // }

    // // ✅ Search filter (like SQL @Search)
    // if (searchText) {
    //   const s = String(searchText).toLowerCase();
    //   filtered = filtered.filter(
    //     (i: any) =>
    //       (i.Username && i.Username.toLowerCase().includes(s)) ||
    //       (i.AGENT_ANSWER_RATE &&
    //         String(i.AGENT_ANSWER_RATE).toLowerCase().includes(s)) ||
    //       (i.sum_idle_time_agent &&
    //         String(i.sum_idle_time_agent).toLowerCase().includes(s))
    //   );
    // }

    // ✅ Aggregation (replicating SQL GROUP BY UUID)
    const grouped: Record<string, any> = {};
    filtered.forEach((i: any) => {
      const uuid = i.Agentid;
      if (!grouped[uuid]) {
        grouped[uuid] = {
          id: uuid,
          UUID: uuid,
          Username: i.Username || null,
          CONTACTS_HANDLED: 0,
          Agent_non_response: 0,
          sum_idle_time_agent: 0,
          sum_contact_time_agent: 0,
          SUM_NON_PRODUCTIVE_TIME_AGENT: 0,
          sum_online_time_AGENT: 0,
          AVG_AFTER_CONTACT_WORK_TIME: 0,
          AVG_INTERACTION_TIME: 0,
          AVG_HOLD_TIME: 0,
          AVG_HANDLE_TIME: 0,
          StartTime: i.StartTime,
          EndTime: i.EndTime,
          loginid: null,
        };
      }
      const g = grouped[uuid];
      g.id = i.Agentid;
      g.CONTACTS_HANDLED += Number(i.CONTACTS_HANDLED || 0);
      g.Agent_non_response += Number(i.Agent_non_response || 0);
      g.sum_idle_time_agent += Number(i.sum_idle_time_agent || 0);
      g.sum_contact_time_agent += Number(i.sum_contact_time_agent || 0);
      g.SUM_NON_PRODUCTIVE_TIME_AGENT += Number(
        i.SUM_NON_PRODUCTIVE_TIME_AGENT || 0
      );
      g.sum_online_time_AGENT += Number(i.sum_online_time_AGENT || 0);
      g.AVG_AFTER_CONTACT_WORK_TIME += Number(
        i.AVG_AFTER_CONTACT_WORK_TIME || 0
      );
      g.AVG_INTERACTION_TIME += Number(i.AVG_INTERACTION_AND_HOLD_TIME || 0);
      g.AVG_HOLD_TIME += Number(i.AVG_HOLD_TIME || 0);
      g.AVG_HANDLE_TIME += Number(i.AVG_HANDLE_TIME || 0);

      // Update min/max times
      g.StartTime = moment.min(moment(g.StartTime), moment(i.StartTime));
      g.EndTime = moment.max(moment(g.EndTime), moment(i.EndTime));
    });

    const agentUUIDs = new Set<string>();

    Object.values(grouped).forEach((item: any) => {
      if (item.UUID) agentUUIDs.add(item.UUID)
    });

    // Batch get agents
    let agents: Record<string, any> = {};
    if (agentUUIDs.size > 0) {
      const agentParams = {
        RequestItems: {
          TblmstAgentSummary: {
            Keys: Array.from(agentUUIDs).map((uuid) => ({ UUID: uuid }))
          }
        }
      };
      const agentData = await dynamo.batchGet(agentParams).promise();
      agentData.Responses?.TblmstAgentSummary?.forEach((a: any) => {
        agents[a.UUID] = {
          agentname: `${a.FirstName || ""} ${a.LastName || ""}`.trim(),
          loginid: a.Username,
          UUID: a.UUID
        };
      });
    }
    // Merge results back
    Object.values(grouped).forEach((item: any) => {
      if (item.UUID) {
        item.Username = agents[item.UUID]?.agentname || 'NA';
        item.loginid = agents[item.UUID]?.loginid || 'NA';
      }
    });
    // ✅ Final computed metrics like SQL
    let result = Object.values(grouped).map((g: any) => {
      return {
        id: g.id,
        loginid: g.loginid,
        Username: g.Username,
        AGENT_ANSWER_RATE:
          g.CONTACTS_HANDLED + g.Agent_non_response === 0
            ? 0
            : (
              (g.CONTACTS_HANDLED /
                (g.CONTACTS_HANDLED + g.Agent_non_response)) *
              100
            ).toFixed(2),
        AVG_HANDLE_TIME: g.CONTACTS_HANDLED
          ? formatTime(g.AVG_HANDLE_TIME / g.CONTACTS_HANDLED)
          : "00:00:00",
        AVG_HOLD_TIME: g.CONTACTS_HANDLED
          ? formatTime(g.AVG_HOLD_TIME / g.CONTACTS_HANDLED)
          : "00:00:00",
        AVG_INTERACTION_TIME: g.CONTACTS_HANDLED
          ? formatTime(g.AVG_INTERACTION_TIME / g.CONTACTS_HANDLED)
          : "00:00:00",
        AVG_AFTER_CONTACT_WORK_TIME: g.CONTACTS_HANDLED
          ? formatTime(g.AVG_AFTER_CONTACT_WORK_TIME / g.CONTACTS_HANDLED)
          : "00:00:00",
        CONTACTS_HANDLED: g.CONTACTS_HANDLED,
        Agent_non_response: g.Agent_non_response,
        sum_idle_time_agent: g.sum_idle_time_agent,
        sum_contact_time_agent: g.sum_contact_time_agent,
        SUM_NON_PRODUCTIVE_TIME_AGENT: g.SUM_NON_PRODUCTIVE_TIME_AGENT,
        sum_online_time_AGENT: g.sum_online_time_AGENT,
        StartTime: g.StartTime,
        EndTime: g.EndTime
      };
    });

    function formatTime(seconds: any) {
      if (!seconds || isNaN(seconds)) return "00:00:00";
      seconds = Math.floor(seconds); // ensure integer
      const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
      const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
      const s = Math.floor(seconds % 60).toString().padStart(2, "0");
      return `${h}:${m}:${s}`;
    }


    // ✅ Username filter
    if (sval) {
      const users = sval.split(",");
      result = result.filter((i: any) =>
        users.includes(i.loginid || "")
      );
    }

    // ✅ Sorting (like ORDER BY Username asc)
    result = result.sort((a: any, b: any) =>
      (a.Username || "").localeCompare(b.Username || "")
    );

    // ✅ Pagination
    const start = (Number(currentPage + 1) - 1) * Number(perPage);
    const paginated = result.slice(start, start + Number(perPage));


    // ✅ Return same format as SQL proc
    res.status(200).json([
      paginated, // page data
      [{ count: result.length }], // total count
      result // full data (optional)
    ]);

    if (!allItems.length) {
      return res.status(200).json([paginated, [{ count: result.length }], result]);
    }

  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// for drop down
app.get("/api/dropmetricAGENTREPORT", verifyToken, async (req, res) => {
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool.request().query(`Exec USP_his_AGENT_REPORT_drop`);
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);

    const timezone: any = req.query.timezone;
    const pageSize = parseInt(req.query.pageSize as string) || 100;
    const nextToken = req.query.nextToken ? JSON.parse(decodeURIComponent(req.query.nextToken as string)) : null;
    const allTimezones = moment.tz.names();
    const tz: any = allTimezones.includes(timezone) ? timezone : "Asia/Kolkata";

    const params: any = {
      TableName: 'TblmstAgentSummary',
      Limit: pageSize,
    };

    if (nextToken) {
      params.ExclusiveStartKey = nextToken; // DynamoDB continuation
    }

    const data = await dynamo.scan(params).promise();

    if (!data.Items || data.Items.length === 0) {
      return res.status(200).json({ message: "No records found" });
    }

    const mergedData: any = {};

    data.Items.forEach((item: any) => {
      const contactId = item.UUID;

      if (!mergedData[contactId]) {
        mergedData[contactId] = {
          Username: null,
          ID: null
        };
      }
      const toTZ = (utcTime: any) =>
        utcTime ? moment(utcTime).tz(tz).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]") : null;
      if (item.Username) mergedData[contactId].Username = item.Username;
      if (item.Username) mergedData[contactId].ID = item.Username;
    });
    const result = Object.values(mergedData);
    res.status(200).json([result]);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
app.get("/api/realtimeData", verifyToken, async (req: any, res: any) => {
  try {
    // const { queueid = null } = req.query;
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(
    //     `Exec usp_GetSkillReport ${queueid !== null ? "'" + queueid + "'" : "NULL"
    //     }`
    //   );
    // console.log("SQL query executed successfully.");
    // res.json(result.recordset);

    const { PageNo = 1, RowCountPerPage = 15, queueid = "" } = req.query;
    const today = new Date().toISOString().slice(0, 10);

    // 1️⃣ Fetch all tables
    const [
      routingQueue,
      agentSummary,
      currentAgentData,
      queueData,
      historicalQueue,
      contactData
    ] = await Promise.all([
      dynamo.scan({ TableName: "TblmstRoutingQueue" }).promise(),
      dynamo.scan({ TableName: "TblmstAgentSummary" }).promise(),
      dynamo.scan({ TableName: "TbltrnCurrentAgentCalldata" }).promise(),
      dynamo.scan({
        TableName: "TblmstQueue",
        FilterExpression: "QueueType = :qt",
        ExpressionAttributeValues: { ":qt": "STANDARD" }
      }).promise(),
      dynamo.scan({
        TableName: "TbltrnHistoricalQueue",
        FilterExpression: "begins_with(StartTime, :today)",
        ExpressionAttributeValues: { ":today": today }
      }).promise(),
      dynamo.scan({
        TableName: TABLE_NAME,
        FilterExpression: "begins_with(eventTime, :today)",
        ExpressionAttributeValues: { ":today": today }
      }).promise()
    ]);

    // Convert Items
    const rqItems = routingQueue.Items || [];
    const agentItems = agentSummary.Items || [];
    const curItems = currentAgentData.Items || [];
    const qItems = queueData.Items || [];
    const histItems = historicalQueue.Items || [];
    const contactItems = contactData.Items || [];

    // // 2️⃣ Filter queue param (simulate STRING_SPLIT + CASE WHEN)
    // const allowedQueues = queueid?queueid.split(",").map((q: string) => q.trim()):[];
    // const filterQueue = (qid: string) => allowedQueues.includes(qid) || allowedQueues.includes(qItems.map((q: any) => q.UUID));

    // Parse queueid into an array (if provided)
    const allowedQueues = queueid
      ? queueid.split(",").map((q: string) => q.trim())
      : [];

    // Filter function
    const filterQueue = (qid: string) => {
      if (allowedQueues.length === 0) return true;
      // Otherwise, only allow queues that match
      return allowedQueues.includes(qid);
    };

    // 3️⃣ Build Skill info (equivalent to #temp, #temp1, #temp3)
    const skillMap: any[] = qItems.map((q: any) => {
      const related = curItems.filter((c: any) => c.QueueId === q.UUID);
      const latest = related.reduce((a: any, b: any) =>
        new Date(a.InsertedDate) > new Date(b.InsertedDate) ? a : b,
        related[0]);
      return {
        QueueId: q.UUID,
        SkillName: q.Names,
        CallInQueue: latest?.CONTACTS_IN_QUEUE || 0,
        AvailableAgent: latest?.AGENTS_AVAILABLE || 0,
        AgentOnCall: (parseInt(latest?.AGENTS_ON_CALL || 0) -
          parseInt(latest?.AGENTS_AFTER_CONTACT_WORK || 0)) || 0,
        AgentOnAux: latest?.AGENTS_NON_PRODUCTIVE || 0
      };
    });

    // 4️⃣ Count distinct agents per queue (simulate #temp3)
    const queueAgentCounts = rqItems.reduce((acc: any, rq: any) => {
      const agents = agentItems.filter((a: any) => a.RoutingProfileId === rq.RouteProfileId);
      acc[rq.QueueId] = {
        queueName: rq.QueueName,
        count: new Set(agents.map((a: any) => a.Username)).size
      };
      return acc;
    }, {});

    // 5️⃣ Abandon rate (simulate #temp5)
    const abandonRates = histItems.reduce((acc: any, h: any) => {
      const key = h.queue_id;
      if (!acc[key]) acc[key] = { abandoned: 0, handled: 0 };
      acc[key].abandoned += Number(h.CONTACTS_ABANDONED || 0);
      acc[key].handled += Number(h.CONTACTS_HANDLED || 0);
      return acc;
    }, {});
    const abandonMap = Object.keys(abandonRates).reduce((acc: any, qid: string) => {
      const { abandoned, handled } = abandonRates[qid];
      const total = abandoned + handled;
      acc[qid] = total > 0 ? ((abandoned / total) * 100).toFixed(2) : 0;
      return acc;
    }, {});

    // 6️⃣ Contact Data (simulate #tempG + #tempg3 row_number)
    const contactGrouped = contactItems.reduce((acc: any, c: any) => {
      const key = `${c?.queueInfo?.queueArn.split('queue/')[1]}-${c?.agentInfo?.agentArn.split('agent/')[1]}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(c);
      return acc;
    }, {});

    const contactMax = Object.values(contactGrouped).map((arr: any) => {
      const latest = arr.reduce((a: any, b: any) =>
        new Date(a.initiationTimestamp) > new Date(b.initiationTimestamp) ? a : b,
        arr[0]);
      return latest;
    });

    // Map agent names
    const contactWithAgent = contactMax.map((c: any) => {
      const q = qItems.find((q: any) => q.UUID === c?.queueInfo?.queueArn.split('queue/')[1]);
      const a = agentItems.find((x: any) => x.UUID === c?.agentInfo?.agentArn.split('agent/')[1]);
      return {
        queueArn: c?.queueInfo?.queueArn.split('queue/')[1],
        Username: a?.Username || null,
        initiationTimeStamp: c.initiationTimestamp,
        Names: q?.Names
      };
    });

    // 7️⃣ Final join (like last SELECT)
    const finalReport = skillMap
      .filter(s => filterQueue(s.QueueId))
      .map(s => {
        const queueCount = queueAgentCounts[s.QueueId]?.count || 0;
        const abandonRate = abandonMap[s.QueueId] || 0;
        const contact = contactWithAgent.find((c: any) => c.queueArn === s.QueueId);
        return {
          Username: contact?.Username || null,
          Abandonrate: abandonRate,
          SkillName: s.SkillName,
          CallInQueue: s.CallInQueue,
          AvailableAgent: s.AvailableAgent,
          AgentOnCall: String(s.AgentOnCall),
          AgentOnAux: s.AgentOnAux,
          TotalAgent: queueCount,
          QueueId: s.QueueId
        };
      });

    // 8️⃣ Pagination
    const page = parseInt(PageNo);
    const limit = parseInt(RowCountPerPage);
    const start = (page - 1) * limit;
    const paginated = finalReport.slice(start, start + limit);
    res.json(paginated);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// for sidebar
app.get("/api/getmenu", verifyToken, async (req, res) => {

  const { userid = "" } = req.query;
  // try {
  //   const pool = await poolPromise;
  //   console.log("Connected to the database.");
  //   const result = await pool.request().query(`Exec usp_get_menu ${userid}`);
  //   console.log("SQL query executed successfully.");
  //   res.json(result.recordsets);
  // } catch (error) {
  //   console.error("Error executing SQL query:", error);
  //   res.status(500).json({ error: "Internal Server Error", details: error });
  // } finally {
  //   console.log("Closing the database connection.");
  // }
  try {
    const [
      menu,
      submenu,
      accessrole
    ] = await Promise.all([
      dynamo.scan({
        TableName: "tblmst_menu",
        FilterExpression: "isActive = :active",
        ExpressionAttributeValues: { ":active": "1" }
      }).promise(),
      dynamo.scan({
        TableName: "tblmst_sub_menu",
        FilterExpression: "isActive = :active",
        ExpressionAttributeValues: { ":active": "1" }
      }).promise(),
      dynamo.scan({
        TableName: "tblmst_Accessroles",
        FilterExpression: "username = :user",
        ExpressionAttributeValues: { ":user": userid }
      }).promise()
    ]);

    const menuItems = menu.Items || [];
    const subMenuItems = submenu.Items || [];
    const accessRoleItems = accessrole.Items || [];

    const accessibleMenuIds = accessRoleItems.flatMap((r: any) => r.Action.split(','))
    // ✅ only keep menu items where user has access
    //const accessibleMenuIds = accessRoleItems.map((role: any) => Number(role.Action));

    let finalmenu = menuItems.filter((m: any) => accessibleMenuIds.includes(String(m.m_id)));

    // sort by [order]
    finalmenu = finalmenu.sort((a: any, b: any) => Number(a.order) - Number(b.order));

    // ✅ only keep submenus that belong to accessible menus
    let finalsubmenu = subMenuItems.filter((sm: any) =>
      accessibleMenuIds.includes(String(sm.m_id))
    );

    // sort by [order]
    finalsubmenu = finalsubmenu.sort((a: any, b: any) => Number(a.order) - Number(b.order));

    const finalres = [
      finalmenu,
      finalsubmenu
    ]
    res.json(finalres);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }

});
app.get("/api/getrealtimedetails", verifyToken, async (req, res) => {
  const { queuename = null } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool.request().query(`EXEC getdetaildrealtimedata ${"'" + queuename + "'"}`);
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);

    let routeProfileIds1: string[] = [];
    const routeParams = {
      TableName: "TblmstRoutingQueue",
      FilterExpression: "QueueName = :qname AND #ch IN (:v, :c)",
      ExpressionAttributeNames: {
        "#ch": "Channel"
      },
      ExpressionAttributeValues: {
        ":qname": queuename,
        ":v": "VOICE",
        ":c": "CHAT"
      }
    };

    const routeResult = await dynamo.scan(routeParams).promise();
    routeProfileIds1.push(...routeResult.Items.map((i: any) => i.RouteProfileId));

    let resultIds = new Set<string>();
    for (let i = 0; i < routeProfileIds1.length; i++) {
      const agentParams = {
        TableName: "TblmstAgentSummary",
        FilterExpression: "#rp = :id",
        ExpressionAttributeNames: {
          "#rp": "RoutingProfileId"
        },
        ExpressionAttributeValues: {
          ":id": routeProfileIds1[i]
        }
      };
      const agentResult = await dynamo.scan(agentParams).promise();
      agentResult.Items.forEach((i: any) => {
        resultIds.add(i.RoutingProfileId);
      });
    }
    // Step 3: Send distinct RouteProfileIds back
    const finalIds = Array.from(resultIds).map(id => ({ RouteProfileId: id }));
    console.log("Result:", finalIds);
    res.json([finalIds]);

    // const routeProfileIds = routeResult.Items.map((i: any) => i.RouteProfileId);
    // if (routeProfileIds.length === 0) return [];

    // // Step 2: Check in TblmstAgentSummary where channel in (VOICE, CHAT)
    // const agentParams = {
    //   TableName: "TblmstAgentSummary",
    //   FilterExpression: "#rp = :id0",
    //   ExpressionAttributeNames: {
    //     "#rp": "RoutingProfileId"
    //   },
    //   ExpressionAttributeValues: {
    //     ":id0": routeProfileIds[0]
    //   }
    // };
    // const agentResult = await dynamo.scan(agentParams).promise();
    // const resultIds = [...new Set(agentResult.Items.map((i: any) => i.RoutingProfileid))];

    // console.log("Result:", resultIds);
    // res.json([resultIds]);

  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
app.get("/api/getusername", verifyToken, async (req, res) => {
  const { queuename = null } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool.request().query(`EXEC usp_getusername ${"'" + queuename + "'"}`);
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);
    const params = {
      TableName: "TblmstAgentSummary",
      Key: {
        UUID: queuename
      },
      ProjectionExpression: "Username"
    };
    const result = await dynamo.get(params).promise();
    const data = [result.Item];
    res.json([data]);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// Get AllUser Details
app.get("/api/getalluserdetails", verifyToken, async (req: any, res: any) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
    timerange = null,
  } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(
    //     `Exec [usp_GetAllUserDetail] ${currentPage},${perPage},${searchText !== null ? "'" + searchText + "'" : "NULL"
    //     }`
    //   );
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);

    const user = await dynamo.scan({ TableName: "tblmst_user" }).promise();
    const mergedData: any = {};
    user.Items.forEach((item: any) => {
      const contactId = item.userloginid;
      if (!mergedData[contactId]) {
        mergedData[contactId] = {
          id: contactId,
          userloginid: contactId,
          username: null,
          useremail: null,
          UserType: null,
          active: null,
          DomainId: null
        };
      }
      if (item.username) mergedData[contactId].username = item.username;
      if (item.useremail) mergedData[contactId].useremail = item.useremail;
      if (item.usertype) mergedData[contactId].UserType = item.usertype;

      if (item.active === '1' || item.active === 1) mergedData[contactId].active = 'ACTIVE';
      else if (item.active === 0 || item.active === '0') mergedData[contactId].active = 'IN ACTIVE';

    });

    const userTypeUUIDs = new Set<string>();
    Object.values(mergedData).forEach((item: any) => {
      if (item.UserType) userTypeUUIDs.add(item.UserType);
    });

    let userTypes: Record<string, any> = {};
    if (userTypeUUIDs.size > 0) {
      const userTypeParams = {
        RequestItems: {
          tbl_UserType: {
            Keys: Array.from(userTypeUUIDs).map((uuid) => ({ id: Number(uuid) }))
          }
        }
      };
      const userTypeData = await dynamo.batchGet(userTypeParams).promise();
      userTypeData.Responses?.tbl_UserType?.forEach((q: any) => {
        userTypes[q.id] = { Names: q.usertype };
      });
    }
    // Merge results back
    Object.values(mergedData).forEach((item: any) => {
      if (item.UserType && userTypes[item.UserType]) {
        item.UserType = userTypes[item.UserType].Names;
      }
    });

    let result = Object.values(mergedData);

    const paginated = result.slice(currentPage * perPage, (currentPage + 1) * perPage);

    res.json([
      paginated,
      [{ count: Object.values(mergedData).length }],
      result
    ]);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// Get AllUser Details
app.get("/api/getusertype", verifyToken, async (req, res) => {
  const { userid = "" } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(`Exec [usp_getusertype] ${"'" + userid + "'"}`);
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);

    const params = {
      TableName: "tbl_UserType"
    }
    const data = await dynamo.scan(params).promise();
    const mergedData: any = {};
    data.Items.forEach((s: any) => {
      const id = s.id

      if (!mergedData[id]) {
        mergedData[id] = {
          id: id,
          usertype: null,
          isSelected: null
        };
      }
      mergedData[id].id = s.id;
      mergedData[id].usertype = s.usertype;
      mergedData[id].isSelected = 1;
    });

    const result = Object.values(mergedData);

    res.json([
      result
    ])
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
const getMaxUserLoginId = async () => {
  let maxId = 0;
  let lastEvaluatedKey = null;

  do {
    let result: any = await dynamo.scan({
      TableName: "tblmst_user",
      ProjectionExpression: "userloginid", // only fetch this field
      ExclusiveStartKey: lastEvaluatedKey
    }).promise();

    // Find local max in this page
    result.Items.forEach((item: any) => {
      const id = Number(item.userloginid);  // ensure numeric
      if (id > maxId) maxId = id;
    });

    // Continue scanning if paginated
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return maxId;
};
// insert  add user modal data
app.post("/api/adduser", verifyToken, async (req, res) => {
  let customdata = req.body;
  try {
    const maxUserLoginId = await getMaxUserLoginId();
    const id = maxUserLoginId + 1; // next id
    const userloginid = id.toString();
    const defaultPassword = "India@123";
    // Hash the password like SQL (SHA2_256)
    const hashedPassword = crypto
      .createHash("sha256")
      .update(defaultPassword)
      .digest("hex");

    const user = await dynamo
      .put({
        TableName: "tblmst_user",
        Item: {
          userid: id, // primary key (must exist in your schema)
          username: customdata.userName,
          useremail: customdata.userEmail,
          usertype: customdata.userType,
          active: customdata.isActive,
          userloginid: userloginid,
          userpass: hashedPassword.toUpperCase(), // store as uppercase to match SQL
          inserteddate: new Date().toISOString(),
        },
        ConditionExpression: "attribute_not_exists(username)", // prevent overwrite
      })
      .promise();
    res.json({ Data: "Data inserted successfully" });

  } catch (error) {
    console.error("Error inside getdbdata.getrouteprofile:", error);
    // res.status(500).json({ error: 'Internal Server Error', details: error });
  } finally {
    console.log("Closing the database connection.");
    //
  }
});
// Get Access Details
app.get("/api/getaccessroles", verifyToken, async (req, res) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
    timerange = null,
  } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(
    //     `Exec [usp_getaccessroles]  ${currentPage},${perPage},${searchText !== null ? "'" + searchText + "'" : "NULL"
    //     }`
    //   );
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);

    const accessRolesData = await dynamo.scan({
      TableName: "tblmst_Accessroles",
    }).promise();

    let items = accessRolesData.Items || [];

    // 2. Expand skills and actions
    items = items.flatMap((item: any) => {
      const skills = (item.skills || "").split(",").map((s: any) => s.trim()).filter(Boolean);
      const actions = (item.Action || "").split(",").map((a: any) => a.trim()).filter(Boolean);
      return skills.map((skill: any) => ({
        ...item,
        skill,
        actions,
      }));
    });

    // 3. Load related tables
    const [menus, queues, users, userTypes] = await Promise.all([
      dynamo.scan({ TableName: "tblmst_menu" }).promise(),
      dynamo.scan({ TableName: "TblmstQueue" }).promise(),
      dynamo.scan({ TableName: "tblmst_user" }).promise(),
      dynamo.scan({ TableName: "tbl_UserType" }).promise(),
    ]);

    const menuMap = (menus.Items || []).reduce((acc: any, m: any) => {
      acc[m.m_id] = m.menu_name;
      return acc;
    }, {});
    const queueMap = new Map((queues.Items || []).map((q: any) => [q.UUID, q.Names]));
    const userMap = new Map((users.Items || []).map((u: any) => [u.userloginid, u]));
    const typeMap = new Map((userTypes.Items || []).map((t: any) => [t.id, t.usertype]));

    // 4. Join manually
    const enriched = items.map((item: any) => {
      const user = userMap.get(item.username) || {};
      const userType = typeMap.get(Number((user as any).usertype)) || null;
      const permissionNames = item.actions.map((id: any) => menuMap[id]).filter(Boolean);
      return {
        userloginid: (user as any).userloginid,
        username: (user as any).username,
        userType,
        permissions: permissionNames,
        skill: queueMap.get(item.skill),
      };
    });

    // 5. Group by userloginid
    const grouped: Record<string, any> = {};
    for (const row of enriched) {
      if (!grouped[row.userloginid]) {
        grouped[row.userloginid] = {
          id: row.userloginid,
          userloginid: row.userloginid,
          username: row.username,
          userType: row.userType,
          permissions: new Set<string>(),
          skills: new Set<string>(),
        };
      }
      row.permissions.forEach((p: string) => grouped[row.userloginid].permissions.add(p));
      if (row.skill) grouped[row.userloginid].skills.add(row.skill);
    }

    let result = Object.values(grouped).map((u: any) => ({
      ...u,
      permissions: Array.from(u.permissions).join(", "),
      skills: Array.from(u.skills).join(", "),
    }));

    // 6. Apply search
    if (searchText) {
      result = result.filter(u =>
        String(u.userloginid).includes(String(searchText)) ||
        (u.username || "").toLowerCase().includes(String(searchText).toLowerCase())
      );
    }

    // 7. Paging
    const total = result.length;
    const start = Number(currentPage) * Number(perPage);
    const paged = result.slice(start, start + Number(perPage));

    // 8. Return
    res.json([
      paged,
      [{ count: total }],
      result
    ]);

  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// Get Permission Details
app.get("/api/getpermission", verifyToken, async (req, res) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
    timerange = null,
  } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool.request().query(`Exec [usp_getpermission]`);
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);

    const data = await dynamo.scan({
      TableName: "tblmst_menu",
      FilterExpression: "isActive = :active",
      ExpressionAttributeValues: { ":active": "1" }
    }).promise();

    const mergedData = data.Items?.map((item: any) => ({
      p_id: item.m_id,
      name: item.menu_name
    }));

    res.json([mergedData]);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
const getMaxUseraccess = async () => {
  let maxId = 0;
  let lastEvaluatedKey = null;

  do {
    let result: any = await dynamo.scan({
      TableName: "tblmst_Accessroles",
      ProjectionExpression: "id", // only fetch this field
      ExclusiveStartKey: lastEvaluatedKey
    }).promise();

    // Find local max in this page
    result.Items.forEach((item: any) => {
      const id = Number(item.id);  // ensure numeric
      if (id > maxId) maxId = id;
    });

    // Continue scanning if paginated
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return maxId;
};
// insert  add user modal data
app.post("/api/insertaccessroles", verifyToken, async (req, res) => {
  let customdata = req.body;

  // const pool = await poolPromise;
  // const table = new sql.Table();
  // table.columns.add("Username", sql.NVarChar(500));
  // table.columns.add("roles", sql.NVarChar(sql.MAX));
  // table.columns.add("[Action] ", sql.NVarChar(500));
  // table.rows.add(customdata.username, customdata.userType, customdata.action);
  try {
    // const pool = await poolPromise;
    // const request = pool.request();
    // request.input("TT_Accessroles", table);   
    // request.execute("usp_insert_Accessroles", (err, result) => {
    //   if (err) {
    //     console.error(err);
    //   } else {
    //     console.log("Data inserted successfully" + result);
    //   }
    // });

    // const { username, userType, action } = customdata;
    // const userTypes = userType.split(",");
    // const actions = action.split(",");

    // // Generate all combinations of userType x action

    // for (const act of actions) {

    //   const scanParams = {
    //     TableName: "tblmst_Accessroles",
    //     FilterExpression: "#u = :u AND #a = :a",
    //     ExpressionAttributeNames: {
    //       "#u": "username",
    //       "#a": "Action",
    //     },
    //     ExpressionAttributeValues: {
    //       ":u": username,
    //       ":a": act.trim(),
    //     },
    //   };

    //   const existingItem = await dynamo.scan(scanParams).promise();
    //   const maxId = await getMaxUseraccess();
    //   const id = maxId + 1;
    //   const newid = id;

    //   if (!existingItem.Item) {
    //     // Insert
    //     const paramsPut = {
    //       TableName: "tblmst_Accessroles",
    //       Item: {
    //         id: newid,
    //         username,
    //         Action: act.trim(),
    //         skills: userType.trim(),
    //       },
    //     };
    //     await dynamo.put(paramsPut).promise();
    //   } else {
    //     // Update
    //     const paramsUpdate = {
    //       TableName: "tblmst_Accessroles",
    //       Key: { username, action: act.trim() },
    //       UpdateExpression: "SET skills = :s",
    //       ExpressionAttributeValues: {
    //         ":s": userType.trim(),
    //       },
    //     };
    //     await dynamo.update(paramsUpdate).promise();
    //   }
    // }

    // res.status(200).json({ message: "Access roles processed successfully" });


    const { username, userType, action } = customdata;
    const userTypes = userType.split(",");
    const actions = action.split(",");

    const params = {
      TableName: "tblmst_Accessroles",
      Item: {
        username: username,
        skills: userType,
        Action: action
      }
    }
    await dynamo.put(params).promise();
  } catch (error) {
    console.error("Error inside getdbdata.getrouteprofile:", error);
  } finally {
    console.log("Closing the database connection.");
    //
  }
});

// Get Permission Details
app.get("/api/getuseraccessname", verifyToken, async (req, res) => {
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(`Exec [usp_get_tblmst_user_drop]`);
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);
    const usersResp = await dynamo.scan({
      TableName: "tblmst_user",
      FilterExpression: "active = :active",
      ExpressionAttributeValues: { ":active": "1" }
    }).promise();
    const users = usersResp.Items;
    const rolesResp = await dynamo.scan({
      TableName: "tblmst_Accessroles"
    }).promise();
    const roles = rolesResp.Items;
    const roleUsernames = new Set(roles.map((r: any) => r.username));
    let result = [];
    if (roleUsernames.size > 0) {
      result = users.filter((u: any) => !roleUsernames.has(u.userloginid));
    } else {
      result = users;
    }
    const formatted = result.map((u: any) => ({
      id: u.userloginid,
      Names: u.username
    }));
    res.json([formatted]);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// app.get('/api/validateuser', async (req, res) => {
//   const { username = null, password = null } = req.query;
//   try {
//     const pool = await poolPromise;
//     console.log('Connected to the database.');
//     // const request = pool.request();
//     // request.input('queuename', sql.VarChar, queuename);
//     const result = await pool.request().query(`EXEC usp_validateuser ${"'" + username + "'"},${"'" + password + "'"}`);
//     console.log('SQL query executed successfully.');
//     res.json(result.recordsets);
//   } catch (error) {
//     console.error('Error executing SQL query:', error);
//     res.status(500).json({ error: 'Internal Server Error', details: error });
//   } finally {
//     console.log('Closing the database connection.');
//   }
// });

app.get("/api/validateuser", async (req, res) => {
  const { username = null, password = null } = req.query;
  try {
    const hashedPass = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex")
      .toUpperCase();

    const params = {
      TableName: "tblmst_user",
      KeyConditionExpression: "#userloginid = :userloginid",
      FilterExpression: "#userpass = :userpass",
      ExpressionAttributeNames: {
        "#userloginid": "userloginid",
        "#userpass": "userpass"
      },
      ExpressionAttributeValues: {
        ":userloginid": username,
        ":userpass": hashedPass
      }
    };
    const data = await dynamo.query(params).promise();

    if (data.Items && data.Items.length > 0) {
      data.Items = data.Items.map((item: any) => ({
        ...item,
        checks: "Authorize"
      }));

      // const params1 = {
      //   TableName: "tblmst_Accessroles",
      //   KeyConditionExpression: "#username = :username",
      //   ExpressionAttributeNames: {
      //     "#username": "username",
      //   },
      //   ExpressionAttributeValues: {
      //     ":username": username,
      //   },
      // };

      const params1 = {
        TableName: "tblmst_Accessroles",
        FilterExpression: "#username = :username",
        ExpressionAttributeNames: {
          "#username": "username"
        },
        ExpressionAttributeValues: {
          ":username": username
        }
      };

      let data1 = await dynamo.scan(params1).promise();

      // Extract only skills
      let skills = data1.Items.map((item: any) => item.skills);

      // // Apply DISTINCT manually
      skills = [...new Set(skills)];

      // // Handle ISNULL equivalent
      if (skills.length === 0) {
        skills = [null];
      }

      const params2 = {
        TableName: "tbl_UserType",
        KeyConditionExpression: "#id = :id",
        ExpressionAttributeNames: {
          "#id": "id",   // actual column name in tbl_UserType
        },
        ExpressionAttributeValues: {
          ":id": Number(data?.Items[0]?.usertype),  // use the usertype value from first query as id
        },
      };

      let data2 = await dynamo.query(params2).promise();

      // Extract only skills
      let usertypename = data2.Items.map((item: any) => item.usertype);

      function newGuid(): string {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
          const r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
      const result = {
        recordset: data.Items,
        recordsets: [data.Items, skills.map((s: any) => ({ skills: s })), usertypename, [{ uuid: newGuid() }]],
        rowsAffected: [data.Count],
      };
      const userResult = result as unknown as UserResultSet;
      const token = generateToken(userResult);
      const RefToken = generateRefreshToken(userResult);
      console.log("SQL query executed successfully.");
      // res.json(result.recordsets);
      res.json({ token: token, RefToken: RefToken, tokenType: "Bearer" });

    }

    if (data.Items.length === 0) {
      return res.json({ token: "Incorrect" });
    }

  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// for check Session
app.post("/api/checksession", async (req, res) => {
  const { accessToken } = req.body;
  try {
    const expired = isTokenExpired(accessToken);
    console.log(expired);
    res.json(expired ? "Token is expired" : "Token is valid");
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
app.post("/api/decodedata", async (req, res) => {
  const { accessToken } = req.body;
  try {
    const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
    const REFRESH_SECRET =
      process.env.REFRESH_SECRET || "your-refresh-secret-key";
    const decoded = jwt.verify(accessToken, JWT_SECRET);
    res.json({ data: decoded });
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
app.post("/api/refreshToken", async (req: express.Request, res: express.Response) => {
  const { refToken } = req.body;

  try {
    const REFRESH_SECRET =
      process.env.REFRESH_SECRET || "your-refresh-secret-key";

    // 👇 Use type assertion to safely access decoded values
    const decoded = jwt.verify(refToken, REFRESH_SECRET) as DecodedUser;
    const user: DecodedUser = {
      userloginid: decoded.userId,
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      useremail: decoded.useremail,
      skills: decoded.skills,
      checks: decoded.checks,
      usertype: decoded.usertype,
      uuid: decoded.uuid,
    };

    const token = refreshAccessToken(refToken);
    const RefToken = generateRefreshToken1(user);

    res.json({
      token,
      RefToken,
      result: { recordsets: [user] }, // optional: depends on what your frontend expects
    });
  } catch (error) {
    console.error("Error verifying refresh token:", error);
    res
      .status(500)
      .json({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : error,
      });
  } finally {
    console.log("Handled /api/refreshToken request.");
  }
}
);
app.get("/api/getDeleteroles", verifyToken, async (req, res) => {
  const { userid = "" } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(`Exec [usp_deleteroles]  ${"'" + userid + "'"}`);
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);

    ////////////////////////////// This is  not a good aproach if username is not primary key /////////////////////////
    // // 1. Find the item(s) by username
    // const result = await dynamo.scan({
    //   TableName: "tblmst_Accessroles",
    //   FilterExpression: "#u = :username",
    //   ExpressionAttributeNames: { "#u": "username" },
    //   ExpressionAttributeValues: { ":username": userid }
    // }).promise();

    // // 2. Delete each item by id
    // for (const item of result.Items) {
    //   await dynamo.delete({
    //     TableName: "tblmst_Accessroles",
    //     Key: { id: item.id }
    //   }).promise();
    // }



    const data = await dynamo.delete({
      TableName: "tblmst_Accessroles",
      Key: { username: userid }
    }).promise();
    res.json({ message: "Roles deleted successfully" });
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
app.post("/api/updateuser", verifyToken, async (req, res) => {
  const customdata = req.body;
  try {
    const username = customdata.username;
    const params = {
      TableName: "tblmst_Accessroles",
      Key: { username }, // if you have a sort key, include it here
      UpdateExpression: "SET #a = :a, #ut = :ut",
      ExpressionAttributeNames: {
        "#a": "Action",
        "#ut": "skills",
      },
      ExpressionAttributeValues: {
        ":a": customdata.action,
        ":ut": customdata.userType,
      },
      ReturnValues: "ALL_NEW", // returns updated item
    };
    const res = await dynamo.update(params).promise();
    res.json({
      message: "User access updated successfully"
    });
  } catch (error) {
    console.error("Error inside getdbdata.getrouteprofile:", error);
    // res.status(500).json({ error: 'Internal Server Error', details: error });
  } finally {
    console.log("Closing the database connection.");
    //
  }
});
app.get("/api/getPermissionreport", verifyToken, async (req, res) => {
  const { userid = "" } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(`Exec [usp_getreportid]  ${"'" + userid + "'"}`);
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);
    if (!userid) {
      return res.status(200).json([]);
    }
    const rolesResp = await dynamo.query({
      TableName: "tblmst_Accessroles",
      KeyConditionExpression: "username = :uid",
      ExpressionAttributeValues: {
        ":uid": userid
      }
    }).promise();
    const roles = rolesResp.Items;
    if (roles.length === 0) {
      return res.json({ menus: [], queues: [] });
    }
    // Collect Actions (menu IDs) and Skills
    const actionIds = roles.map((r: any) => r.Action).filter(Boolean);
    const skills = roles
      .flatMap((r: any) => (r.skills ? r.skills.split(",") : []))
      .map((s: any) => s.trim())
      .filter(Boolean);

    const arrid = actionIds[0].split(",");

    // Step 2: Fetch menus (m_id in actionIds)
    let menus = [];
    if (actionIds.length > 0) {
      // const menuResp = await dynamo.scan({
      //   TableName: "tblmst_menu",
      //   FilterExpression: "m_id IN (" + arrid.map((_: any, i: number) => `:m${i}`).join(",") + ")",
      //   ExpressionAttributeValues: arrid.reduce((acc: any, id: String, i: number) => {
      //     acc[`:m${i}`] = String(id);
      //     return acc;
      //   }, {})
      // }).promise();
      const menuResp = await dynamo.scan({
        TableName: "tblmst_menu",
        FilterExpression: "m_id IN (" + arrid.map((_: any, i: any) => `:m${i}`).join(", ") + ")",
        ExpressionAttributeValues: arrid.reduce((acc: any, id: string, i: number) => {
          acc[`:m${i}`] = Number(id); // ensure it's a string
          return acc;
        }, {})
      }).promise();

      menus = menuResp.Items.map((m: any) => ({
        m_id: m.m_id,
        names: m.menu_name
      }));
    }

    // Step 3: Fetch queues (UUID in skills)
    let queues = [];
    if (skills.length > 0) {
      const queueResp = await dynamo.scan({
        TableName: "TblmstQueue",
        FilterExpression: "#u IN (" + skills.map((_: any, i: any) => `:q${i}`).join(",") + ")",
        ExpressionAttributeNames: { "#u": "UUID" },
        ExpressionAttributeValues: skills.reduce((acc: any, uu: any, i: any) => {
          acc[`:q${i}`] = uu;
          return acc;
        }, {})
      }).promise();
      queues = queueResp.Items.map((q: any) => ({
        UUID: q.UUID,
        Names: q.Names
      }));
    }

    res.json([menus, queues]);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
app.get("/api/getAgentDetails", verifyToken, async (req, res) => {
  const { userid = "" } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool.request().query(`Exec [usp_getallagent]`);
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);

    const timezone: any = req.query.timezone;
    const pageSize = parseInt(req.query.pageSize as string) || 100;
    const nextToken = req.query.nextToken ? JSON.parse(decodeURIComponent(req.query.nextToken as string)) : null;
    const allTimezones = moment.tz.names();
    const tz: any = allTimezones.includes(timezone) ? timezone : "Asia/Kolkata";

    const params: any = {
      TableName: 'TblmstAgentSummary',
      Limit: pageSize,
    };

    if (nextToken) {
      params.ExclusiveStartKey = nextToken; // DynamoDB continuation
    }

    const data = await dynamo.scan(params).promise();

    if (!data.Items || data.Items.length === 0) {
      return res.status(200).json({ message: "No records found" });
    }

    const mergedData: any = {};

    data.Items.forEach((item: any) => {
      const contactId = item.UUID;

      if (!mergedData[contactId]) {
        mergedData[contactId] = {
          UserName: null,
        };
      }
      const toTZ = (utcTime: any) =>
        utcTime ? moment(utcTime).tz(tz).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]") : null;
      if (item.Username) mergedData[contactId].UserName = item.Username;
    });
    const result = Object.values(mergedData);
    res.status(200).json([result]);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
app.get("/api/abondon", verifyToken, async (req: any, res: any) => {
  try {
    // const {
    //   currentPage = 1,
    //   perPage = 7,
    //   searchText = null,
    //   fromdate = null,
    //   todate = null,
    //   queueid = null,
    //   multiagent = null,
    //   multiqueue = null,
    // } = req.query;
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(
    //     `Exec usp_getabandon  ${currentPage},${perPage},${searchText !== null ? "'" + searchText + "'" : "NULL"
    //     },${fromdate !== null ? "'" + fromdate + "'" : "NULL"},${todate !== null ? "'" + todate + "'" : "NULL"
    //     },${queueid !== null ? "'" + queueid + "'" : "NULL"},${multiagent !== null ? "'" + multiagent + "'" : "NULL"
    //     },${multiqueue !== null ? "'" + multiqueue + "'" : "NULL"}`
    //   );
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);

    const {
      currentPage = 1,
      perPage = 7,
      searchText = null,
      sval = null,
      fromdate = null,
      todate = null,
      queueid = null,
    } = req.query;

    const timezone: any = req.query.timezone;
    const allTimezones = moment.tz.names();
    const tz: any = allTimezones.includes(timezone) ? timezone : "Asia/Kolkata";
    // 📌 DynamoDB scan parameters
    let params: any = {
      TableName: "tblmst_abandonreport", // change table name
      FilterExpression: "#state IN (:s1,:s2,:s3)",
      ExpressionAttributeNames: {
        "#state": "contact_state",
      },
      ExpressionAttributeValues: {
        ":s1": "MISSED",
        ":s2": "REJECTED",
        ":s3": "ERROR",
      },
    };

    const data = await dynamo.scan(params).promise();
    // if (!data.Items || data.Items.length === 0) {
    //   return res.status(200).json({ message: "No records found" });
    // }

    const mergedData: any = {};
    data.Items.forEach((item: any) => {
      const contactId = item.contact_id;
      if (!mergedData[contactId]) {
        mergedData[contactId] = {
          id: contactId,
          contact_state: item.contact_state || null,
          contact_id: contactId,
          starttime: item.starttime || null,
          systemendpoint: item.systemendpoint || null,
          callernumber: item.callernumber || null,
          channel: item.channel || null,
          Queueid: item.Queueid || null,
          Userid: item.Userid || null,
          queueArn: item.Queueid || null,
          agentArn: item.Userid || null,
          Username: null,
          val1: null,
          val: null,
        };
      }

      const toTZ = (utcTime: any) =>
        utcTime
          ? moment(utcTime).tz(tz).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]")
          : null;

    });

    const agentUUIDs = new Set<string>();
    const queueUUIDs = new Set<string>();

    Object.values(mergedData).forEach((item: any) => {
      if (item.Userid) agentUUIDs.add(item.Userid);
      if (item.Queueid) queueUUIDs.add(item.Queueid);
    });

    // Batch get agents
    let agents: Record<string, any> = {};
    if (agentUUIDs.size > 0) {
      const agentParams = {
        RequestItems: {
          TblmstAgentSummary: {
            Keys: Array.from(agentUUIDs).map((uuid) => ({ UUID: uuid }))
          }
        }
      };
      const agentData = await dynamo.batchGet(agentParams).promise();
      agentData.Responses?.TblmstAgentSummary?.forEach((a: any) => {
        agents[a.UUID] = {
          agentname: `${a.FirstName || ""} ${a.LastName || ""}`.trim(),
          loginid: a.Username,
          UUID: a.UUID
        };
      });
    }

    // Batch get queues
    let queues: Record<string, any> = {};
    if (queueUUIDs.size > 0) {
      const queueParams = {
        RequestItems: {
          TblmstQueue: {
            Keys: Array.from(queueUUIDs).map((uuid) => ({ UUID: uuid }))
          }
        }
      };
      const queueData = await dynamo.batchGet(queueParams).promise();
      queueData.Responses?.TblmstQueue?.forEach((q: any) => {
        queues[q.UUID] = { Names: q.Names };
      });
    }

    // Merge results back
    Object.values(mergedData).forEach((item: any) => {
      if (item.Userid) {
        item.Userid = agents[item.Userid]?.agentname || 'NA';
      }
      if (item.Queueid && queues[item.Queueid]) {
        item.Queueid = queues[item.Queueid]?.Names || 'NA';
      }
    });

    let result = Object.values(mergedData);


    // ✅ Apply filters after merging
    // let result: any[] = Object.values(mergedData);


    // Date range filter
    if (fromdate && todate) {
      result = result.filter((r: any) => {
        if (!r.starttime) return false;
        const eventTime = moment(r.starttime);
        return (
          eventTime.isSameOrAfter(moment(fromdate)) &&
          eventTime.isSameOrBefore(moment(todate))
        );
      });
    }

    // Queue filter
    if (queueid) {
      const queueIds = queueid.split(",").map((id: string) => id.trim());
      result = result.filter((r: any) => queueIds.includes(r.queueArn));
    }

    // Search filter (can search in Username or customerNumber or dnis)
    if (searchText) {
      const lowerSearch = String(searchText).toLowerCase();
      result = result.filter(
        (r: any) =>
          (r.Username && r.Username.toLowerCase().includes(lowerSearch)) ||
          (r.customerNumber &&
            r.customerNumber.toLowerCase().includes(lowerSearch)) ||
          (r.dnis && r.dnis.toLowerCase().includes(lowerSearch))
      );
    }

    // sval filter (example: matches val1 or val field)
    if (sval) {
      result = result.filter(
        (r: any) =>
          (r.val1 && r.val1.toString().includes(sval)) ||
          (r.val && r.val.toString().includes(sval))
      );
    }

    // Pagination (currentPage, perPage)
    const startIndex = (Number(currentPage + 1) - 1) * Number(perPage);
    const paginatedData = result.slice(startIndex, startIndex + Number(perPage));
    if (!data.Items || data.Items.length === 0) {

      //  return res.status(200).json({ message: "No records found" });
      return res.status(200).json([
        result,
        [{ count: result.length }],
        result,
        {
          nextToken: data.LastEvaluatedKey
            ? encodeURIComponent(JSON.stringify(data.LastEvaluatedKey))
            : null
        }
      ]);
    }

    res.status(200).json([
      paginatedData,
      [{ count: result.length }],
      result
    ]);

  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
app.get("/api/wrapupreport", verifyToken, async (req: any, res: any) => {
  try {
    const {
      currentPage = 1,
      perPage = 7,
      searchText = null,
      fromdate = null,
      todate = null,
      queueid = null,
      sval = null,
    } = req.query;
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(
    //     `Exec [usp_getagentwrapupsummary]  ${currentPage},${perPage},${searchText !== null ? "'" + searchText + "'" : "NULL"
    //     },${fromdate !== null ? "'" + fromdate + "'" : "NULL"},${todate !== null ? "'" + todate + "'" : "NULL"
    //     },${queueid !== null ? "'" + queueid + "'" : "NULL"},${sval !== null ? "'" + sval + "'" : "NULL"
    //     }`
    //   );
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);

    const page = parseInt(currentPage);
    const limit = parseInt(perPage);
    const start = (page) * limit;

    // Split comma params like STRING_SPLIT
    const agentFilter = sval ? sval.split(",").filter((x: string) => x.trim() !== "") : [];
    const queueFilter = queueid ? queueid.split(",").filter((x: string) => x.trim() !== "") : [];

    // Date filters
    const fromDate = fromdate ? new Date(fromdate) : null;
    const toDate = todate ? new Date(todate) : null;

    // Fetch Dynamo tables
    const agentSummary = await dynamo.scan({ TableName: "TblmstAgentSummary" }).promise();
    const routeQueues = await dynamo.scan({ TableName: "TblmstRoutingQueue" }).promise();
    const metrics = await dynamo.scan({ TableName: "TbltrnHistoricalAgent" }).promise();

    // ✅ Build queue-agent mapping
    const allowedAgents = new Set(
      agentSummary.Items.filter((a: any) => {
        const rq = routeQueues.Items.find((r: any) => r.RouteProfileId === a.RoutingProfileId);
        if (!rq) return false;
        if (!queueFilter.length || queueFilter.includes("1") || queueFilter.includes(rq.QueueId)) {
          return ["VOICE", "CHAT"].includes(rq.Channel);
        }
        return false;
      }).map((a: any) => a.UUID)
    );

    // ✅ Aggregate per agent
    const grouped: Record<string, any> = {};

    for (const m of metrics.Items) {
      if (!allowedAgents.has(m.Agentid)) continue;

      // Date filter
      const startTime = new Date(m.StartTime);
      const endTime = new Date(m.EndTime);
      if ((fromDate && startTime < fromDate) || (toDate && endTime > toDate)) continue;

      if (!grouped[m.Agentid]) {
        grouped[m.Agentid] = {
          Agentid: m.Agentid,
          TotalCalls: 0,
          TotalHandle: 0,
          WeightedHandle: 0,
          MaxHandle: 0,
          TalkPctWeighted: 0,
          TotalACW: 0,
          WeightedACW: 0,
          MaxACW: 0,
          StartTime: startTime,
          EndTime: endTime
        };
      }

      const g = grouped[m.Agentid];

      const calls = parseFloat(m.CONTACTS_HANDLED || 0);
      const sumHandle = parseFloat(m.SUM_HANDLE_TIME || 0);
      const avgHandle = parseFloat(m.AVG_HANDLE_TIME || 0);
      const talkPct = parseFloat(m.PERCENT_TALK_TIME || 0);
      const sumACW = parseFloat(m.SUM_AFTER_CONTACT_WORK_TIME || 0);
      const avgACW = parseFloat(m.AVG_AFTER_CONTACT_WORK_TIME || 0);

      if (calls === 0 || sumHandle === 0 || sumACW === 0) continue;

      g.TotalCalls += calls;
      g.TotalHandle += sumHandle;
      g.WeightedHandle += avgHandle * calls; // weighted avg
      g.MaxHandle = Math.max(g.MaxHandle, sumHandle);

      g.TalkPctWeighted += talkPct * calls;

      g.TotalACW += sumACW;
      g.WeightedACW += avgACW * calls; // weighted avg
      g.MaxACW = Math.max(g.MaxACW, sumACW);

      g.StartTime = g.StartTime < startTime ? g.StartTime : startTime;
      g.EndTime = g.EndTime > endTime ? g.EndTime : endTime;
    }

    // ✅ Format durations
    const formatSec = (s: number) =>
      s ? new Date(s * 1000).toISOString().substr(11, 8) : "00:00:00";

    let result = Object.values(grouped).map((g: any) => {
      const agentRow = agentSummary.Items.find((a: any) => a.UUID === g.Agentid);

      const avgHandle = g.TotalCalls > 0 ? g.WeightedHandle / g.TotalCalls : 0;
      const avgACW = g.TotalCalls > 0 ? g.WeightedACW / g.TotalCalls : 0;
      const pctACW = g.TotalHandle > 0 ? (100 * g.TotalACW) / g.TotalHandle : 0;
      const talkPct = g.TotalCalls > 0 ? g.TalkPctWeighted / g.TotalCalls : 0;

      return {
        id: agentRow?.UUID,
        AgentId: agentRow?.UUID,
        username: `${agentRow?.FirstName} ${agentRow?.LastName}`,
        "Total calls": g.TotalCalls,
        "Total Handle Time": formatSec(g.TotalHandle),
        "Avg Handle Time": formatSec(avgHandle),
        "Max Handle Time": formatSec(g.MaxHandle),
        "% Talk Time": talkPct.toFixed(2),
        "Total ACW Time": formatSec(g.TotalACW),
        "AVG ACW Time": formatSec(avgACW),
        "Max ACW Time": formatSec(g.MaxACW),
        "% ACW": `${Math.round(pctACW)}%`,
        starttime: g.StartTime.toISOString(),
        endtime: g.EndTime.toISOString()
      };
    });

    // ✅ Apply agent filter
    if (agentFilter.length > 0) {
      result = result.filter((r: any) => agentFilter.includes(r.AgentId));
    }

    // ✅ Apply search filter
    if (searchText) {
      const s = searchText.toLowerCase();
      result = result.filter((r: any) =>
        Object.values(r).some((val) =>
          String(val).toLowerCase().includes(s)
        )
      );
    }

    // ✅ Pagination
    const paginated = result.slice(start, start + limit);

    res.json([paginated, [{ count: result.length }], paginated]);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});

// app.get("/api/getAgentTimeLine", async (req, res) => {
//   const { fromdate = null, todate = null } = req.query;
//   try {
//     const pool = await poolPromise;
//     console.log("Connected to the database.");
//     const result = await pool
//       .request()
//       .query(
//         `Exec [usp_getAgentTimeLine]${fromdate !== null ? "'" + fromdate + "'" : "NULL"
//         },${todate !== null ? "'" + todate + "'" : "NULL"} `
//       );
//     console.log("SQL query executed successfully.");

//     res.json(result.recordsets);
//   } catch (error) {
//     console.error("Error executing SQL query:", error);
//     res.status(500).json({ error: "Internal Server Error", details: error });
//   } finally {
//     console.log("Closing the database connection.");
//   }
// });

app.get("/api/getAgentTimeLine", verifyToken, async (req, res) => {
  const { fromdate = null, todate = null } = req.query;
  try {
    const params = {
      TableName: "TbltrnAgentActivityAux",
      FilterExpression: "#d BETWEEN :start AND :end AND #a IN (:a1, :a2, :a3, :a4, :a5, :a6)",
      ExpressionAttributeNames: {
        "#d": "Duration",
        "#a": "Activity"
      },
      ExpressionAttributeValues: {
        ":start": fromdate,
        ":end": todate,
        ":a1": "Available",
        ":a2": "Lunch",
        ":a3": "Break",
        ":a4": "Offline",
        ":a5": "Training",
        ":a6": "Meeting"
      }
    }

    // 1. Pull activity data
    const activityResp = await dynamo.scan(params).promise();
    const activities = activityResp.Items || [];
    // 2. Map Activity → Status
    const statusMap: any = {
      Available: "AVAILABLE",
      Lunch: "LUNCH",
      Break: "BREAK",
      Training: "TRAINING",
      Meeting: "MEETING",
      Offline: "OFFLINE"
    };
    let timeline = [];
    for (let act of activities) {
      const { UUID, RoutingProfileId, Duration, Activity } = act;
      // Find END_TIME (next activity for same UUID)
      const next = activities
        .filter((x: any) => x.UUID === UUID && x.Duration > Duration)
        .sort((a: any, b: any) => new Date(a.Duration).getTime() - new Date(b.Duration).getTime())[0];
      const END_TIME = next ? next.Duration : null;
      // Duration difference
      let diff = "";
      if (END_TIME) {
        const d1 = new Date(Duration).getTime();
        const d2 = new Date(END_TIME).getTime();
        const ms = d2 - d1;
        const hh = String(Math.floor(ms / (1000 * 60 * 60))).padStart(2, "0");
        const mm = String(Math.floor((ms / (1000 * 60)) % 60)).padStart(2, "0");
        const ss = String(Math.floor((ms / 1000) % 60)).padStart(2, "0");
        diff = `${hh}:${mm}:${ss}`;
      }
      timeline.push({
        UUID,
        RoutingProfileId,
        START_TIME: Duration,
        END_TIME: END_TIME || new Date().toISOString(),
        STATUS: statusMap[Activity] || null,
        Duration: diff
      });
    }
    // 3. Enrich with Agent + RoutingProfile
    const agentIds = [...new Set(timeline.map(t => t.UUID))];
    const profileIds = [...new Set(timeline.map(t => t.RoutingProfileId))];
    const resp = await dynamo.batchGet({
      RequestItems: {
        TblmstAgentSummary: {
          Keys: agentIds.map(UUID => ({ UUID }))
        },
        TblmstRoutingProfile: {
          Keys: profileIds.map(UUID => ({ UUID }))
        }
      }
    }).promise();
    const agentMap: any = {};
    (resp.Responses["TblmstAgentSummary"] || []).forEach((a: any) => {
      agentMap[a.UUID] = a;
    });
    const profileMap: any = {};
    (resp.Responses["TblmstRoutingProfile"] || []).forEach((r: any) => {
      profileMap[r.UUID] = r;
    });
    const enriched = timeline.map(t => {
      const agent = agentMap[t.UUID] || {};
      const profile = profileMap[t.RoutingProfileId] || {};
      return {
        // Username: agent.Username,
        // FirstName: agent.FirstName,
        // LastName: agent.LastName,
        // RoutingProfile: profile.Names,
        // START_TIME: t.START_TIME,
        // END_TIME: t.END_TIME,
        // Duration: t.Duration,
        // STATUS: t.STATUS
        agent: agent.Username,
        start: t.START_TIME,
        end: t.END_TIME,
        type: t.STATUS,

      };
    });
    // 4. Add rankNumber like SQL dense_rank()
    let rank = 0;
    let lastUser: any = null;
    const finalTimeline = enriched
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.end).getTime())
      .map(row => {
        if (row.agent !== lastUser) {
          rank++;
          lastUser = row.agent;
        }
        return { ...row, rankNumber: rank - 1 };
      });
    res.json([
      finalTimeline,
      ({ count: finalTimeline.length })
    ]);
  } catch (error) {
    console.error("Error executing DynamoDB query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Handled getAgentTimeLine request.");
  }
});



const getMaxId = async () => {
  let maxId = 0;
  let lastEvaluatedKey = null;
  do {
    let result: any = await dynamo.scan({
      TableName: "tblmst_thresholdreport",
      ProjectionExpression: "id", // only fetch this field
      ExclusiveStartKey: lastEvaluatedKey
    }).promise()

    // Find local max in this page
    result.Items.forEach((item: any) => {
      const id = Number(item.id);  // ensure numeric
      if (id > maxId) maxId = id;
    });

    // Continue scanning if paginated
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return maxId;
};
app.post("/api/threshold", verifyToken, async (req: any, res: any) => {
  let customdata = req.body;
  const Id = await getMaxId();
  const ruleId = Id + 1;

  try {
    // 1. Insert threshold report(s)
    const putOps = await dynamo.put({
      TableName: "tblmst_thresholdreport",
      Item: {
        id: ruleId,
        RuleName: customdata.ruleName,
        RuleType: customdata.ruleType,
        Hos: customdata.hoursOfOperationStart,
        Hoe: customdata.hoursOfOperationEnd,
        DayofWeek: customdata.daysOfWeek,
        Queue: customdata.skillNo,
        staffingLevelStart: customdata.staffingLevelStart,
        staffingLevelEnd: customdata.staffingLevelEnd,
        notificationmethod: customdata.notificationMethod,
        frequencyOfAlerts: customdata.frequencyOfAlerts,
        notificationMessage: customdata.notificationMessage,
        recipientsContactList: customdata.recipientsContactList,
        recipientsEmailList: customdata.recipientsEmailList,
        ruleActivationDate: customdata.ruleActivationDate,
        ruleDeactivationDate: customdata.ruleDeactivationDate,
      },
    })
      .promise()


    await Promise.all(putOps);

    // 2. Get all users from tblmst_user
    const usersResp = await dynamo
      .scan({
        TableName: "tblmst_user",
        ProjectionExpression: "userloginid",
      })
      .promise();

    const users = usersResp.Items || [];

    // 3. Insert notifications for each user
    const notificationWrites = users.map((u: any) => ({
      PutRequest: {
        Item: {
          NotificationId: 1110,
          userloginid: u.userloginid,
          otherField: null,
          RuleId: ruleId,
        },
      },
    }));

    // DynamoDB batch limit = 25
    for (let i = 0; i < notificationWrites.length; i += 25) {
      const batch = notificationWrites.slice(i, i + 25);
      await dynamo
        .batchWrite({
          RequestItems: {
            tblAgentNotification: batch,
          },
        })
        .promise();
    }
    res.json({ message: "Threshold inserted successfully", ruleId });
  } catch (error) {
    console.error("Error in /api/threshold:", error);
    res.status(500).json({ error: error });
  } finally {
    console.log("Finished /api/threshold request");
  }
});
app.get("/api/getthresholddetails", verifyToken, async (req: any, res: any) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    fromdate = null,
    todate = null,
  } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(
    //     `Exec [usp_getthresholdlist] ${currentPage},${perPage},${searchText !== null ? "'" + searchText + "'" : "NULL"
    //     }`
    //   );
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);
    const agentScan = await dynamo.scan({
      TableName: "tblAgentNotification",
      //ProjectionExpression: "id, lastexecuted",
    }).promise();

    const latestById: any = {};

    for (let row of agentScan.Items) {
      const cur = latestById[row.id];
      if (!cur || new Date(row.LastExecuted) > new Date(cur)) {
        latestById[row.id] = row.LastExecuted;
      }
    }
    // Step 2: scan thresholdreport with pagination
    let items = [];
    let startKey = null;

    const datacount: any = await dynamo.scan({ TableName: "tblmst_thresholdreport" }).promise();

    for (let i = 0; i <= Number(currentPage); i++) {
      const result: any = await dynamo.scan({
        TableName: "tblmst_thresholdreport",
        ExclusiveStartKey: startKey,
        Limit: Number(perPage),
      }).promise();

      startKey = result.LastEvaluatedKey || null;

      if (i === Number(currentPage)) {
        items = result.Items;
      }
      if (!startKey) break;
    }

    // Step 3: enrich with Queue + lastexecuted
    for (let item of items) {
      // get Queue
      const queue = await dynamo
        .get({
          TableName: "TblmstQueue",
          Key: { UUID: item.Queue },
        })
        .promise();
      // enrich
      item["frequencyofalerts"] = item.frequencyOfAlerts;
      item.Names = queue.Item?.Names || null;
      item.workinghours = `${item.Hos} to ${item.Hoe}`;
      item.Threshold = `level is ${item.staffingLevelStart}`;
      item.notificationtype = item.notificationmethod;
      item.LastExecuted = latestById[item.id]
        ? new Date(latestById[item.id]).toISOString().split("T")[0]
        : null;
      // deactivate date
      const today = new Date().toISOString().split("T")[0];
      const ruleDate = item.ruleDeactivationDate?.split("T")[0];
      item.DeactivateDate =
        ruleDate && ruleDate > today ? ruleDate : "expired";
    }
    res.json([items, [{ count: datacount.Items.length }], items]);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});


app.get("/api/auxsummaryreport", async (req, res) => {
  const {
    currentPage = 0,
    perPage = 7,
    searchText = null,
    sval = null,
    fromdate = null,
    todate = null,
    queueid = null,
  } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool.request().query(
    //     `Exec usp_getAgentreadyAuxReport ${currentPage},${perPage},${searchText !== null ? "'" + searchText + "'" : "NULL"
    //     },${sval !== null ? "'" + sval + "'" : "NULL"},${fromdate !== null ? "'" + fromdate + "'" : "NULL"
    //     },${todate !== null ? "'" + todate + "'" : "NULL"},${queueid !== null ? "'" + queueid + "'" : "NULL"
    //     }`
    //   );
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);
    const params = {
      TableName: "TbltrnAgentActivityAux",
      FilterExpression: "#time BETWEEN :start AND :end",
      ExpressionAttributeNames: { "#time": "Duration" },
      ExpressionAttributeValues: {
        ":start": fromdate + "T00:00:00Z",
        ":end": todate + "T23:59:59Z",
      }
    };

    // Step 2: Get agents
    const agentData = await dynamo.scan(params).promise();
    const agentsRes = await dynamo.scan({ TableName: "TblmstAgentSummary" }).promise();
    const agentMap: any = {};
    const agentName: any = {};
    agentsRes.Items.forEach((a: any) => (agentMap[a.UUID] = a.Username));
    agentsRes.Items.forEach((a: any) => (agentName[a.UUID] = a.FirstName + ' ' + a.LastName));


    // Helper to calculate duration in hh:mm:ss
    function getDurationString(ms: any) {
      let totalSeconds = Math.floor(ms / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      totalSeconds %= 3600;
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Group by UUID and Activity
    const grouped: any = {};
    agentData.Items.forEach(({ UUID, Activity, Duration }: { UUID: string; Activity: string; Duration: string }) => {
      const date = new Date(Duration + "Z");
      if (!grouped[UUID]) grouped[UUID] = {};
      if (!grouped[UUID][Activity]) grouped[UUID][Activity] = { min: date, max: date };
      if (date < grouped[UUID][Activity].min) grouped[UUID][Activity].min = date;
      if (date > grouped[UUID][Activity].max) grouped[UUID][Activity].max = date;
    });

    // Prepare output for console.table
    const output = [];
    for (const uuid in grouped) {
      for (const activity in grouped[uuid]) {
        const minTime = grouped[uuid][activity].min;
        const maxTime = grouped[uuid][activity].max;
        output.push({
          UUID: uuid,
          Activity: activity,
          MinTime: minTime.toISOString().replace('T', ' ').split('.')[0],
          MaxTime: maxTime.toISOString().replace('T', ' ').split('.')[0],
          Duration: getDurationString(maxTime - minTime)
        });
      }
    }

    function formatDuration(durationStr: any) {
      const [hoursStr, minutesStr, secondsStr] = durationStr.split(':');
      let totalHours = parseInt(hoursStr, 10);
      const minutes = minutesStr;
      const seconds = secondsStr;
      const days = Math.floor(totalHours / 24);
      const hours = totalHours % 24;
      return days > 0 ? `${days}D ${hours.toString().padStart(2, '0')}:${minutes}:${seconds}` : `${hours.toString().padStart(2, '0')}:${minutes}:${seconds}`;
    }

    // Group by UUID
    const grouped1 = Object.values(
      output.reduce((acc: any, item: any) => {
        if (!acc[item.UUID]) acc[item.UUID] = { UUID: item.UUID, Activities: [], Duration: item.Duration };
        acc[item.UUID].Activities.push(`${item.Activity}: ${formatDuration(item.Duration)}`);
        return acc;
      }, {})
    );

    // Helper: parse "3D 04:03:12" → seconds
    function parseDuration(str: string): number {
      let days = 0, timePart = str;
      if (str.includes("D")) {
        const [d, t] = str.split("D");
        days = parseInt(d.trim());
        timePart = t.trim();
      }
      const [hh, mm, ss] = timePart.split(":").map(Number);
      return days * 86400 + hh * 3600 + mm * 60 + ss;
    }

    // Helper: format seconds → "DD HH:MM:SS"
    function formatDurationFromSeconds(seconds: number): string {
      const days = Math.floor(seconds / 86400);
      seconds %= 86400;
      const hh = String(Math.floor(seconds / 3600)).padStart(2, "0");
      seconds %= 3600;
      const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
      const ss = String(seconds % 60).padStart(2, "0");
      return (days > 0 ? `${days}D ` : "") + `${hh}:${mm}:${ss}`;
    }

    // Now add AuxDuration
    const groupedWithAux = grouped1.map((item: any) => {
      let totalSeconds = 0;

      (item.Activities as string[]).forEach((act: string) => {
        const [name, duration] = act.split(": ");
        if (name !== "Available") {
          totalSeconds += parseDuration(duration);
        }
      });

      return {
        ...item,
        AuxDuration: formatDurationFromSeconds(totalSeconds)
      };
    });

    // Convert Activities array to comma-separated string
    let finalResult = groupedWithAux.map((item: any) => ({
      AgentID: agentMap[item.UUID],
      AgentName: agentName[item.UUID],
      Aux_Duration_status: item.Activities.join(', '),
      Auxduration: item.AuxDuration,
      Duration: item.Duration,
      UUID: item.UUID,
      id: item.UUID
    }));



    if (sval) {
      finalResult = finalResult.filter(
        (r: any) =>
          (r.AgentID && r.AgentID.toString().includes(sval)) ||
          (r.AgentID && r.AgentID.toString().includes(sval))
      );
    }
    const startIndex = (Number(currentPage)) * Number(perPage);
    const paginatedData = finalResult.slice(startIndex, startIndex + Number(perPage));

    res.json([paginatedData,
      [{ count: finalResult.length },
        paginatedData
      ]
    ]);

  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});








app.get("/api/getDashboard", verifyToken, async (req, res) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
    fromdate = null,
    todate = null,
    queueid = null,
  } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(
    //     `Exec USP_getDashboard ${queueid !== null ? "'" + queueid + "'" : "NULL"
    //     }`
    //   );
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);
    function onlyUnique(value: any, index: any, self: any) {
      return self.indexOf(value) === index;
    }
    function convertUtcToAnother(date = new Date()) {
      //const hardcodedUtcDate = new Date(Date.UTC(2025, 7, 20, 0, 0, 0));
      //return new Date(hardcodedUtcDate.getTime() + (5.5 * 60 * 60 * 1000));
      return new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
    }
    const currentDate = convertUtcToAnother(new Date()).toISOString().split("T")[0];
    //const queueIdList = queueid ? queueid.split(",") : [];
    let maintable: any = [];
    // for (let queueId of queueIdList) {
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: "#contactId = :contactId",
      FilterExpression: "#time BETWEEN :start AND :end",
      ExpressionAttributeNames: { "#time": "eventTime" },
      ExpressionAttributeValues: {
        ":start": currentDate + "T00:00:00Z",
        ":end": currentDate + "T23:59:59Z"
      }
    };

    const data = await dynamo.scan(params).promise();
    maintable = maintable.concat(data.Items);

    const agentCallData = await dynamo.scan({ TableName: "TbltrnCurrentAgentCalldataCount" }).promise();
    const totalagent = await dynamo.scan({ TableName: "TblmstAgentSummary" }).promise();
    let agentStats = {
      Available: 0,
      Oncall: 0,
      AUX: 0,
      ACW: 0,
      Total: 0,
      LoggedIn: 0
    };
    if (agentCallData.Items.length > 0) {
      const row = agentCallData.Items[0];
      agentStats = {
        Available: row.AGENTS_AVAILABLE || 0,
        Oncall: (row.AGENTS_ON_CALL || 0) - (row.AGENTS_AFTER_CONTACT_WORK || 0),
        AUX: row.AGENTS_NON_PRODUCTIVE || 0,
        ACW: row.AGENTS_AFTER_CONTACT_WORK ? row.AGENTS_AFTER_CONTACT_WORK : 0,
        Total: totalagent.Items.length || 0,
        LoggedIn: row.AGENTS_ONLINE || 0
      };
    }

    const conhan = maintable.filter((m: any) => m.agentInfo?.agentArn.split('agent/')[1] != null).map((m: any) => m.contactId).filter(onlyUnique).length;
    const conabnd = maintable.filter((m: any) => m.agentInfo?.agentArn.split('agent/')[1] == null && m.disconnectTimestamp && m?.queueInfo?.queueArn).map((m: any) => m.contactId).filter(onlyUnique).length;
    const conhanvoice = maintable.filter((m: any) => m.agentInfo?.agentArn.split('agent/')[1] != null && m.channel === "VOICE").map((m: any) => m.contactId).filter(onlyUnique).length;
    const conhanchat = maintable.filter((m: any) => m.agentInfo?.agentArn.split('agent/')[1] != null && m.channel === "CHAT").map((m: any) => m.contactId).filter(onlyUnique).length;
    const conabndvoice = maintable.filter((m: any) => m.agentInfo?.agentArn.split('agent/')[1] == null && m.channel === "VOICE" && m.disconnectTimestamp && m?.queueInfo?.queueArn).map((m: any) => m.contactId).filter(onlyUnique).length;
    const conabndchat = maintable.filter((m: any) => m.agentInfo?.agentArn.split('agent/')[1] == null && m.channel === "CHAT" && m.disconnectTimestamp && m?.queueInfo?.queueArn).map((m: any) => m.contactId).filter(onlyUnique).length;
    const agentAnswerRate = (conhan / ((conhan + conabnd) || 1)) * 100;
    const callData = await dynamo.scan({ TableName: "TbltrnCurrentAgentCalldata" }).promise();
    const availableAgents = agentCallData.Items[0]?.AGENTS_AVAILABLE || 0;
    const totalAgents = totalagent.Items.length || 0;
    const total = totalAgents > 0
      ? Number(((availableAgents / totalAgents) * 100).toFixed(2))
      : 0;
    const totalQueue = callData.Items.reduce((sum: any, r: any) => sum + (r.CONTACTS_IN_QUEUE || 0), 0);
    const voiceQueue = callData.Items.filter((r: any) => r.QueueId !== "d4887946-ebb4-48cc-a58a-269aa4518746").reduce((sum: any, r: any) => sum + (r.CONTACTS_IN_QUEUE || 0), 0);
    const chatQueue = callData.Items.filter((r: any) => r.QueueId === "d4887946-ebb4-48cc-a58a-269aa4518746").reduce((sum: any, r: any) => sum + (r.CONTACTS_IN_QUEUE || 0), 0);
    const metricData = await dynamo.scan({
      TableName: "TbltrnHistoricalQueue",
      FilterExpression: "#StartTime BETWEEN :start AND :end",
      ExpressionAttributeNames: { "#StartTime": "StartTime" },
      //IndexName: "StartTime-index",
      KeyConditionExpression: "StartTime between :start and :end",
      ExpressionAttributeValues: {
        ":start": currentDate + "T00:00:00Z",
        ":end": currentDate + "T23:59:59Z"
      }
    }).promise();
    let metricsSummary: {
      AGENT_ANSWER_RATE: number | null;
      sum_idle_time_agent?: number | null;
      Agent_non_response?: number | null;
      sum_contact_time_agent?: number | null;
      SUM_NON_PRODUCTIVE_TIME_AGENT?: number | null;
      AGENT_OCCUPANCY?: number | null;
      sum_online_time_AGENT?: number | null;
      AVG_AFTER_CONTACT_WORK_TIME?: number | null;
      AVG_INTERACTION_TIME?: number | null;
      AVG_HOLD_TIME?: number | null;
      AVG_HANDLE_TIME?: number | null;
      CONTACTS_HANDLED?: number | null;
      CONTACTS_ABANDONED?: number | null;
      CONTACTS_PUT_ON_HOLD?: number | null;
      CONTACTS_CREATED?: number | null;
      StartTime?: string | null;
      EndTime?: string | null;
    } = {
      AGENT_ANSWER_RATE: null,
      sum_idle_time_agent: null,
      Agent_non_response: null,
      sum_contact_time_agent: null,
      SUM_NON_PRODUCTIVE_TIME_AGENT: null,
      AGENT_OCCUPANCY: null,
      sum_online_time_AGENT: null,
      AVG_AFTER_CONTACT_WORK_TIME: null,
      AVG_INTERACTION_TIME: null,
      AVG_HOLD_TIME: null,
      AVG_HANDLE_TIME: null,
      CONTACTS_HANDLED: null,
      CONTACTS_ABANDONED: null,
      CONTACTS_PUT_ON_HOLD: null,
      CONTACTS_CREATED: null,
      StartTime: null,
      EndTime: null
    };
    if (metricData.Items.length > 0) {
      const handled = metricData.Items.reduce((s: any, r: any) => s + (r.CONTACTS_HANDLED || 0), 0);
      const abandoned = metricData.Items.reduce((s: any, r: any) => s + (r.CONTACTS_ABANDONED || 0), 0);
      metricsSummary.CONTACTS_HANDLED = handled;
      metricsSummary.CONTACTS_ABANDONED = abandoned;
      metricsSummary.AGENT_ANSWER_RATE = handled / ((handled + abandoned) || 1) * 100;
    }
    res.status(200).json([
      [
        {
          Available: agentStats.Available,
          Oncall: agentStats.Oncall,
          AUX: agentStats.AUX,
          ACW: agentStats.ACW
        }
      ],
      [
        {
          Total: total // or your 4.17 equivalent
        }
      ],
      [
        {
          AGENT_ANSWER_RATE: agentAnswerRate ? agentAnswerRate.toFixed(2) : null,
          CONTACTS_HANDLED: conhanvoice || 0,
          CONTACTS_HANDLEDchat: conhanchat || 0,
          CONTACTS_ABANDONED: conabnd || 0,
          CONTACTS_ABANDONEDchat: conabndchat || 0,
          CONTACTS_PUT_ON_HOLD: null,
          CONTACTS_CREATED: conhan + conabnd,
          StartTime: null,
          EndTime: null
        }
      ],
      [
        {
          total: Number(totalQueue) || 0,
          Voice: Number(voiceQueue) || 0,
          chat: Number(chatQueue) || 0
        }
      ],
      [
        {
          AGENT_ANSWER_RATE: metricsSummary.AGENT_ANSWER_RATE || null,
          sum_idle_time_agent: metricsSummary.sum_idle_time_agent || null,
          Agent_non_response: metricsSummary.Agent_non_response || null,
          sum_contact_time_agent: metricsSummary.sum_contact_time_agent || null,
          SUM_NON_PRODUCTIVE_TIME_AGENT: metricsSummary.SUM_NON_PRODUCTIVE_TIME_AGENT || null,
          AGENT_OCCUPANCY: metricsSummary.AGENT_OCCUPANCY || null,
          sum_online_time_AGENT: metricsSummary.sum_online_time_AGENT || null,
          AVG_AFTER_CONTACT_WORK_TIME: metricsSummary.AVG_AFTER_CONTACT_WORK_TIME || null,
          AVG_INTERACTION_TIME: metricsSummary.AVG_INTERACTION_TIME || null,
          AVG_HOLD_TIME: metricsSummary.AVG_HOLD_TIME || null,
          AVG_HANDLE_TIME: metricsSummary.AVG_HANDLE_TIME || null,
          CONTACTS_HANDLED: metricsSummary.CONTACTS_HANDLED || null,
          CONTACTS_ABANDONED: metricsSummary.CONTACTS_ABANDONED || null,
          CONTACTS_PUT_ON_HOLD: metricsSummary.CONTACTS_PUT_ON_HOLD || null,
          CONTACTS_CREATED: metricsSummary.CONTACTS_CREATED || null,
          StartTime: metricsSummary.StartTime || null,
          EndTime: metricsSummary.EndTime || null
        }
      ],
      [
        {
          LoggedIn: agentStats.LoggedIn || 1,
          Available: agentStats.Available,
          Oncall: agentStats.Oncall,
          AUX: agentStats.AUX,
          ACW: agentStats.ACW,
          Total: agentStats.Total
        }
      ]
    ]);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});

// not in use
app.get("/api/getallAgentDetails", verifyToken, async (req, res) => {
  const { loginId } = req.query;
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool
      .request()
      .query(`Exec [usp_getallAgentDetails] ${"'" + loginId + "'"}`);
    console.log("SQL query executed successfully.");

    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});

app.get("/api/queueabandon", verifyToken, async (req: any, res: any) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
    fromdate = null,
    todate = null,
    queueid = null,
  } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(
    //     `Exec usp_getqueueabandon ${currentPage},${perPage},${searchText !== null ? "'" + searchText + "'" : "NULL"
    //     },${sval !== null ? "'" + sval + "'" : "NULL"},${fromdate !== null ? "'" + fromdate + "'" : "NULL"
    //     },${todate !== null ? "'" + todate + "'" : "NULL"},${queueid !== null ? "'" + queueid + "'" : "NULL"
    //     }`
    //   );
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);

    const timezone: any = req.query.timezone;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const nextToken = req.query.nextToken ? JSON.parse(decodeURIComponent(req.query.nextToken as string)) : null;
    const allTimezones = moment.tz.names();
    const tz: any = allTimezones.includes(timezone) ? timezone : "Asia/Kolkata";


    const params: any = {
      TableName: TABLE_NAME,
      Limit: pageSize,
      FilterExpression: "attribute_not_exists(agentArn) AND attribute_exists(queueArn) AND attribute_exists(disconnectTimeStamp)"
    };


    if (nextToken) {
      params.ExclusiveStartKey = nextToken;
    }

    const data = await dynamo.scan(params).promise();

    // if (!data.Items || data.Items.length === 0) {
    //   return res.status(200).json({ message: "No records found" });
    // }


    const mergedData: any = {};

    data.Items.forEach((item: any) => {
      const contactId = item.contactId;

      if (!mergedData[contactId]) {
        mergedData[contactId] = {
          id: contactId,
          account: item.account || null,
          time: item.eventTime || null,
          contactid: contactId,
          channel: item.channel || null,
          initiationTimeStamp: item.initiationTimestamp || null,
          customerNumber: null,
          dnis: null,
          Names: null,
          Duration: null,
          queueArn: null,
          agentArn: null,
        };
      }

      const toTZ = (utcTime: any) =>
        utcTime ? moment(utcTime).tz(tz).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]") : null;

      switch (item.eventType) {
        case "INITIATED":
          mergedData[contactId].initiationTimeStamp = toTZ(item.eventTime);
          break;
      }

      if (item.tags?.eventTime) mergedData[contactId].time = toTZ(item.eventTime);
      if (item.tags?.CLI) mergedData[contactId].customerNumber = item.tags.CLI;
      if (item.tags?.DNIS) mergedData[contactId].dnis = item.tags.DNIS;
      if (item.queueInfo?.queueArn?.match(/queue\/([^/]+)/)?.[1])
        mergedData[contactId].Names = item.queueInfo.queueArn.match(/queue\/([^/]+)/)?.[1] || null;
      if (item.agentInfo?.agentArn?.match(/agent\/([^/]+)/)?.[1])
        mergedData[contactId].agentname = item.agentInfo.agentArn.match(/agent\/([^/]+)/)?.[1] || null;
      if (item.username) mergedData[contactId].username = item.username;
    });

    //const result = Object.values(mergedData);
    const agentUUIDs = new Set<string>();
    const queueUUIDs = new Set<string>();

    Object.values(mergedData).forEach((item: any) => {
      if (item.agentArn) agentUUIDs.add(item.agentArn);
      if (item.queueArn) queueUUIDs.add(item.queueArn);
    });

    // Batch get agents
    let agents: Record<string, any> = {};
    if (agentUUIDs.size > 0) {
      const agentParams = {
        RequestItems: {
          TblmstAgentSummary: {
            Keys: Array.from(agentUUIDs).map((uuid) => ({ UUID: uuid }))
          }
        }
      };
      const agentData = await dynamo.batchGet(agentParams).promise();
      agentData.Responses?.TblmstAgentSummary?.forEach((a: any) => {
        agents[a.UUID] = {
          agentname: `${a.FirstName || ""} ${a.LastName || ""}`.trim(),
          loginid: a.Username,
          UUID: a.UUID
        };
      });
    }

    // Batch get queues
    let queues: Record<string, any> = {};
    if (queueUUIDs.size > 0) {
      const queueParams = {
        RequestItems: {
          TblmstQueue: {
            Keys: Array.from(queueUUIDs).map((uuid) => ({ UUID: uuid }))
          }
        }
      };
      const queueData = await dynamo.batchGet(queueParams).promise();
      queueData.Responses?.TblmstQueue?.forEach((q: any) => {
        queues[q.UUID] = { Names: q.Names };
      });
    }

    // Merge results back
    Object.values(mergedData).forEach((item: any) => {
      if (item.agentArn) {
        item.agentArn = agents[item.agentArn].agentname;
      }
      if (item.queueArn && queues[item.queueArn]) {
        item.queueArn = queues[item.queueArn].Names;
      }
    });

    let result = Object.values(mergedData);

    // Date range filter
    if (fromdate && todate) {
      result = result.filter((r: any) => {
        if (!r.time) return false;
        const eventTime = moment(r.time);
        return (
          eventTime.isSameOrAfter(moment(fromdate)) &&
          eventTime.isSameOrBefore(moment(todate))
        );
      });
    }

    // Queue filter
    if (queueid) {
      const queueIds = queueid.split(",").map((id: string) => id.trim());
      result = result.filter((r: any) => queueIds.includes(r.queueArn));
    }


    // Search filter (can search in Username or customerNumber or dnis)
    if (searchText) {
      const lowerSearch = String(searchText).toLowerCase();
      result = result.filter(
        (r: any) =>
          (r.Username && r.Username.toLowerCase().includes(lowerSearch)) ||
          (r.customerNumber &&
            r.customerNumber.toLowerCase().includes(lowerSearch)) ||
          (r.dnis && r.dnis.toLowerCase().includes(lowerSearch))
      );
    }

    // sval filter (example: matches val1 or val field)
    if (sval) {
      result = result.filter(
        (r: any) =>
          (r.val1 && r.val1.toString().includes(sval)) ||
          (r.val && r.val.toString().includes(sval))
      );
    }

    // Pagination (currentPage, perPage)
    const startIndex = (Number(currentPage + 1) - 1) * Number(perPage);
    const paginatedData = result.slice(startIndex, startIndex + Number(perPage));

    if (!data.Items || data.Items.length === 0) {

      //  return res.status(200).json({ message: "No records found" });
      return res.status(200).json([
        result,
        [{ count: result.length }],
        result,
        {
          nextToken: data.LastEvaluatedKey
            ? encodeURIComponent(JSON.stringify(data.LastEvaluatedKey))
            : null
        }
      ]);
    }

    res.status(200).json([
      paginatedData,
      [{ count: result.length }],
      result, // full filtered data if needed
      {
        nextToken: data.LastEvaluatedKey
          ? encodeURIComponent(JSON.stringify(data.LastEvaluatedKey))
          : null,
      },
    ]);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
app.get("/api/contactdetails", verifyToken, async (req: any, res: any) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    contacttype = "",
    contactchannel = "",
    queueid = null,
  } = req.query;
  try {
    //   const pool = await poolPromise;
    //   console.log("Connected to the database.");
    //   const result = await pool
    //     .request()
    //     .query(
    //       `Exec usp_getcontactdetails ${currentPage},${perPage},${searchText !== null ? "'" + searchText + "'" : "NULL"
    //       },${contacttype !== null ? "'" + contacttype + "'" : "NULL"},${contactchannel !== null ? "'" + contactchannel + "'" : "NULL"
    //       },${queueid !== null ? "'" + queueid + "'" : "NULL"}`
    //     );
    //   console.log("SQL query executed successfully.");
    //   res.json(result.recordsets);
    const page = parseInt(currentPage);
    const limit = parseInt(perPage);
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const queues = queueid ? queueid.split(",").filter((q: string) => q.trim() !== "") : [];

    // === Fetch Dynamo tables ===
    const contactData = await dynamo.scan({
      TableName: TABLE_NAME,
      FilterExpression: "begins_with(connectedToSystemTimestamp, :today) OR begins_with(initiationTimestamp, :today)",
      ExpressionAttributeValues: { ":today": today }
    }).promise();

    const agentSummary = await dynamo.scan({ TableName: "TblmstAgentSummary" }).promise();
    const queuesList = await dynamo.scan({ TableName: "TblmstQueue" }).promise();

    // === Maps for joins ===
    type AgentType = { FirstName?: string; LastName?: string;[key: string]: any; };
    const agentsMap = new Map(agentSummary.Items.map((a: AgentType) => [a.UUID, a]));
    const queueMap = new Map(queuesList.Items.map((q: any) => [q.UUID, q]));

    // === Transform contacts ===
    let results = contactData.Items.map((c: any) => {
      const agentId = c?.agentInfo?.agentArn.split('agent/')[1];
      const agent = agentId ? (agentsMap.get(agentId) as AgentType | undefined) : undefined;
      const queueId = c?.queueInfo?.queueArn.split("queue/")[1];
      const queueRow = c?.queueInfo?.queueArn.split('queue/')[1] ? queueMap.get(c?.queueInfo?.queueArn.split('queue/')[1]) : null;
      const contactTime = c.connectedToSystemTimestamp || c.initiationTimestamp;

      return {
        contactid: c.contactId,
        queueName: queueRow ? (queueRow as { Names?: string })["Names"] : null,
        contactNumber: c?.tags?.CLI || null,
        time: contactTime ? new Date(contactTime).toISOString().replace("T", " ").slice(0, 16) : null,
        agentName: agent ? `${agent.FirstName ?? ""} ${agent.LastName ?? ""}`.trim() : "",
        calltype: c.initiationMethod,
        channel: c.channel,
        queueArn: c?.queueInfo?.queueArn,
        agentArn: c.agentInfo?.agentArn || null,
        disconnectTimeStamp: c.disconnectTimestamp || null
      };
    });
    const timezone: any = req.query.timezone;
    const allTimezones = moment.tz.names();
    const tz: any = allTimezones.includes(timezone) ? timezone : "Asia/Kolkata";

    // const mergedData: Record<string, any> = [];
    const mergedData: any[] = [];
    results.forEach((item: any) => {
      const contactId = item.contactid;

      if (!mergedData[contactId]) {
        mergedData[contactId] = {
          id: contactId,
          contactid: contactId,
          queueName: item.queueName,
          contactNumber: item.contactNumber,
          time: item.time,
          agentName: item.agentName,
          calltype: item.calltype,
          channel: item.channel,
          queueArn: item.queueArn,
          agentArn: item.agentArn,
          disconnectTimeStamp: item.disconnectTimeStamp

        };
      }
      const toTZ = (utcTime: any) =>
        utcTime ? moment(utcTime).tz(tz).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]") : null;

      if (item.channel) mergedData[contactId].channel = item.channel;
      if (item.customerNumber) mergedData[contactId].customerNumber = item.customerNumber;
      if (item.time) mergedData[contactId].time = toTZ(item.time);
      if (item.disconnectTimeStamp) mergedData[contactId].disconnectTimeStamp = toTZ(item.disconnectTimeStamp);

      if (item.queueArn?.match(/queue\/([^/]+)/)?.[1]) {
        mergedData[contactId].queueArn =
          item.queueArn.match(/queue\/([^/]+)/)?.[1] || null;
        mergedData[contactId].queueName = item.queueName || null;
      }

      if (item.agentArn?.match(/agent\/([^/]+)/)?.[1]) {
        mergedData[contactId].agentArn =
          item.agentArn.match(/agent\/([^/]+)/)?.[1] || null;
        mergedData[contactId].agentName = item.agentName || null;
      }
    });

    const uniqueMap = new Map<string, any>();

    results = Object.values(mergedData);

    // === Apply proc-style branching ===
    if (contacttype?.toUpperCase() === "HANDLED") {
      results = results.filter((r: any) => r.agentName); // must have agent
      if (contactchannel) {
        results = results.filter((r: any) => r.channel?.toUpperCase() === contactchannel.toUpperCase());
      }
    } else if (contacttype?.toUpperCase() === "ABANDONED") {
      results = results.filter((r: any) => !r.agentName && r.disconnectTimeStamp);
      if (contactchannel) {
        results = results.filter((r: any) => r.channel?.toUpperCase() === contactchannel.toUpperCase());
      }
    } else {
      // TOTAL case = all handled + abandoned
      results = results.filter((r: any) => r.contactid); // keep all valid contacts
    }

    // === Queue filter ===
    if (queues.length > 0) {
      //results = mergedData.filter((r: any) => queues.includes(r.queueArn));
      results = Object.values(mergedData).filter((record: any) => record.queueName);
    }

    // === Search filter ===
    if (searchText) {
      const searchUpper = searchText.toUpperCase();
      results = results.filter((r: any) =>
        (r.queueName && r.queueName.toUpperCase().includes(searchUpper)) ||
        (r.contactNumber && r.contactNumber.includes(searchText)) ||
        (r.agentName && r.agentName.toUpperCase().includes(searchUpper)) ||
        (r.time && r.time.includes(searchText))
      );
    }

    // === Sort & paginate ===
    results.sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime());
    const count = results.length;
    const paginated = results.slice((page - 1) * limit, page * limit);

    res.json([paginated, [{ count }]]);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});

app.get("/api/getallRoutedetails", verifyToken, async (req, res) => {
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool.request().query(`EXEC getallRoutesdata`);
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);
    // Step 1: Scan tmst_route_queues for channels VOICE/CHAT
    const routeQueues = await dynamo.scan({
      TableName: "TblmstRoutingQueue",
      FilterExpression: "#ch IN (:v, :c)",
      ExpressionAttributeNames: {
        "#ch": "Channel"
      },
      ExpressionAttributeValues: {
        ":v": "VOICE",
        ":c": "CHAT"
      }
    }).promise();

    const routeProfileIdsFromQueues = new Set(
      routeQueues.Items.map((item: any) => item.RouteProfileId)
    );

    const agentSummary = await dynamo.scan({
      TableName: "TblmstAgentSummary",
      ProjectionExpression: "RoutingProfileId"
    }).promise();

    const routeProfileIdsFromAgents = new Set(
      agentSummary.Items.map((item: any) => item.RoutingProfileId)
    );

    // Step 3: Intersection of both sets
    const intersection = [...routeProfileIdsFromQueues].filter(id =>
      routeProfileIdsFromAgents.has(id)
    );

    const output = intersection.map(id => [
      { RouteProfileId: id }
    ]);

    res.json(output); // distinct RouteProfileIds

  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});


//Getitng the inboundSummary
app.get("/api/getinboundsummary", verifyToken, async (req: any, res: any) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
    fromdate = null,
    todate = null,
    queueid = null,
  } = req.query;
  try {
    const timezone: any = req.query.timezone;
    const pageSize = parseInt(req.query.pageSize as string) || 100;
    const nextToken = req.query.nextToken
      ? JSON.parse(decodeURIComponent(req.query.nextToken as string))
      : null;

    const allTimezones = moment.tz.names();
    const tz: any = allTimezones.includes(timezone) ? timezone : "Asia/Kolkata";

    // DynamoDB scan parameters with filters
    const params: any = {
      TableName: TABLE_NAME, // 👈 replace with your table name
      Limit: pageSize,
      FilterExpression: "#et <> :initiated AND #im IN (:inbound, :api, :webrtc)",
      ExpressionAttributeNames: {
        "#et": "eventType",
        "#im": "initiationMethod"
      },
      ExpressionAttributeValues: {
        ":initiated": "INITIATED",
        ":inbound": "INBOUND",
        ":api": "API",
        ":webrtc": "WEBRTC_API"
      }
    };

    if (nextToken) {
      params.ExclusiveStartKey = nextToken;
    }

    const data = await dynamo.scan(params).promise();

    // if (!data.Items || data.Items.length === 0) {
    //   return res.status(200).json({ message: "No records found" });
    // }

    // Merge by contactId to ensure uniqueness
    const mergedData: Record<string, any> = {};

    data.Items.forEach((item: any) => {
      const contactId = item.contactId;

      if (!mergedData[contactId]) {
        mergedData[contactId] = {
          id: contactId,
          contact_id: contactId,
          agentname: null,
          loginid: null,
          UUID: null,
          Names: null,
          starttime: null,
          channel: null,
          queueArn: null
        };
      }

      const toTZ = (utcTime: any) =>
        utcTime ? moment(utcTime).tz(tz).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]") : null;

      // Earliest starttime
      if (
        !mergedData[contactId].starttime ||
        moment(item.eventTime).isBefore(mergedData[contactId].starttime)
      ) {
        mergedData[contactId].starttime = toTZ(item.eventTime);
      }

      if (item.channel) mergedData[contactId].channel = item.channel;

      if (item.queueInfo?.queueArn?.match(/queue\/([^/]+)/)?.[1]) {
        mergedData[contactId].queueArn =
          item.queueInfo.queueArn.match(/queue\/([^/]+)/)?.[1] || null;
      }

      if (item.agentInfo?.agentArn?.match(/agent\/([^/]+)/)?.[1]) {
        mergedData[contactId].UUID =
          item.agentInfo.agentArn.match(/agent\/([^/]+)/)?.[1] || null;
      }
    });

    // ===== 🔹 Fetch Agent + Queue Data =====

    // Collect UUIDs
    const agentUUIDs = new Set<string>();
    const queueUUIDs = new Set<string>();

    Object.values(mergedData).forEach((item: any) => {
      if (item.UUID) agentUUIDs.add(item.UUID);
      if (item.queueArn) queueUUIDs.add(item.queueArn);
    });

    // Batch get agents
    let agents: Record<string, any> = {};
    if (agentUUIDs.size > 0) {
      const agentParams = {
        RequestItems: {
          TblmstAgentSummary: {
            Keys: Array.from(agentUUIDs).map((uuid) => ({ UUID: uuid }))
          }
        }
      };
      const agentData = await dynamo.batchGet(agentParams).promise();
      agentData.Responses?.TblmstAgentSummary?.forEach((a: any) => {
        agents[a.UUID] = {
          agentname: `${a.FirstName || ""} ${a.LastName || ""}`.trim(),
          loginid: a.Username,
          UUID: a.UUID
        };
      });
    }

    // Batch get queues
    let queues: Record<string, any> = {};
    if (queueUUIDs.size > 0) {
      const queueParams = {
        RequestItems: {
          TblmstQueue: {
            Keys: Array.from(queueUUIDs).map((uuid) => ({ UUID: uuid }))
          }
        }
      };
      const queueData = await dynamo.batchGet(queueParams).promise();
      queueData.Responses?.TblmstQueue?.forEach((q: any) => {
        queues[q.UUID] = { Names: q.Names };
      });
    }

    // Merge results back
    Object.values(mergedData).forEach((item: any) => {
      if (item.UUID && agents[item.UUID]) {
        item.agentname = agents[item.UUID].agentname;
        item.loginid = agents[item.UUID].loginid;
        item.UUID = agents[item.UUID].UUID;
      }
      if (item.queueArn && queues[item.queueArn]) {
        item.Names = queues[item.queueArn].Names;
      }
    });

    let result = Object.values(mergedData);


    // Date range filter
    if (fromdate && todate) {
      result = result.filter((r: any) => {
        if (!r.starttime) return false;
        const eventTime = moment(r.starttime);
        return (
          eventTime.isSameOrAfter(moment(fromdate)) &&
          eventTime.isSameOrBefore(moment(todate))
        );
      });
    }
    // Queue filter
    if (queueid) {
      const queueIds = queueid.split(",").map((id: string) => id.trim());
      result = result.filter((r: any) => queueIds.includes(r.queueArn));
    }
    // Search filter (can search in Username or customerNumber or dnis)
    if (searchText) {
      const lowerSearch = String(searchText).toLowerCase();
      result = result.filter(
        (r: any) =>
          (r.Username && r.Username.toLowerCase().includes(lowerSearch)) ||
          (r.customerNumber &&
            r.customerNumber.toLowerCase().includes(lowerSearch)) ||
          (r.dnis && r.dnis.toLowerCase().includes(lowerSearch))
      );
    }

    // sval filter (example: matches val1 or val field)
    if (sval) {
      result = result.filter(
        (r: any) =>
          (r.val1 && r.val1.toString().includes(sval)) ||
          (r.val && r.val.toString().includes(sval))
      );
    }

    // Pagination (currentPage, perPage)
    const startIndex = (Number(currentPage + 1) - 1) * Number(perPage);
    const paginatedData = result.slice(startIndex, startIndex + Number(perPage));

    if (!data.Items || data.Items.length === 0) {
      //  return res.status(200).json({ message: "No records found" });
      res.status(200).json([
        result,
        [{ count: result.length }],
        result,
        {
          nextToken: data.LastEvaluatedKey
            ? encodeURIComponent(JSON.stringify(data.LastEvaluatedKey))
            : null
        }
      ]);
    }
    return res.status(200).json([
      paginatedData,
      [{ count: paginatedData.length }],
      paginatedData,
      {
        nextToken: data.LastEvaluatedKey
          ? encodeURIComponent(JSON.stringify(data.LastEvaluatedKey))
          : null
      }
    ]);

  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
//Getitng the outboundSummary
app.get("/api/getoutboundsummary", verifyToken, async (req, res) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
    fromdate = null,
    todate = null,
    queueid = null,
  } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(
    //     `Exec [USP_outbound_report] ${currentPage},${perPage},${searchText !== null ? "'" + searchText + "'" : "NULL"
    //     },${sval !== null ? "'" + sval + "'" : "NULL"},${fromdate !== null ? "'" + fromdate + "'" : "NULL"
    //     },${todate !== null ? "'" + todate + "'" : "NULL"},${queueid !== null ? "'" + queueid + "'" : "NULL"
    //     }`
    //   );
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);
    const timezone: any = req.query.timezone;
    const pageSize = parseInt(req.query.pageSize as string) || 100;
    const nextToken = req.query.nextToken
      ? JSON.parse(decodeURIComponent(req.query.nextToken as string))
      : null;

    const allTimezones = moment.tz.names();
    const tz: any = allTimezones.includes(timezone) ? timezone : "Asia/Kolkata";

    // DynamoDB scan parameters with filters
    const params: any = {
      TableName: TABLE_NAME, // 👈 replace with your table name
      Limit: pageSize,
      FilterExpression: "#et <> :initiated AND #im IN (:outbound)",
      ExpressionAttributeNames: {
        "#et": "eventType",
        "#im": "initiationMethod"
      },
      ExpressionAttributeValues: {
        ":initiated": "INITIATED",
        ":outbound": "OUTBOUND",

      }
    };


    if (nextToken) {
      params.ExclusiveStartKey = nextToken;
    }

    const data = await dynamo.scan(params).promise();



    // Merge by contactId to ensure uniqueness
    const mergedData: Record<string, any> = {};

    data.Items.forEach((item: any) => {
      const contactId = item.contactId;

      if (!mergedData[contactId]) {
        mergedData[contactId] = {
          id: contactId,
          contact_id: contactId,
          agentname: null,
          loginid: null,
          UUID: null,
          Names: null,
          starttime: null,
          channel: null,
          queueArn: null
        };
      }

      const toTZ = (utcTime: any) =>
        utcTime ? moment(utcTime).tz(tz).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]") : null;

      // Earliest starttime
      if (
        !mergedData[contactId].starttime ||
        moment(item.eventTime).isBefore(mergedData[contactId].starttime)
      ) {
        mergedData[contactId].starttime = toTZ(item.eventTime);
      }

      if (item.channel) mergedData[contactId].channel = item.channel;

      if (item.queueInfo?.queueArn?.match(/queue\/([^/]+)/)?.[1]) {
        mergedData[contactId].queueArn =
          item.queueInfo.queueArn.match(/queue\/([^/]+)/)?.[1] || null;
      }

      if (item.agentInfo?.agentArn?.match(/agent\/([^/]+)/)?.[1]) {
        mergedData[contactId].UUID =
          item.agentInfo.agentArn.match(/agent\/([^/]+)/)?.[1] || null;
      }
    });

    // ===== 🔹 Fetch Agent + Queue Data =====

    // Collect UUIDs
    const agentUUIDs = new Set<string>();
    const queueUUIDs = new Set<string>();

    Object.values(mergedData).forEach((item: any) => {
      if (item.UUID) agentUUIDs.add(item.UUID);
      if (item.queueArn) queueUUIDs.add(item.queueArn);
    });

    // Batch get agents
    let agents: Record<string, any> = {};
    if (agentUUIDs.size > 0) {
      const agentParams = {
        RequestItems: {
          TblmstAgentSummary: {
            Keys: Array.from(agentUUIDs).map((uuid) => ({ UUID: uuid }))
          }
        }
      };
      const agentData = await dynamo.batchGet(agentParams).promise();
      agentData.Responses?.TblmstAgentSummary?.forEach((a: any) => {
        agents[a.UUID] = {
          agentname: `${a.FirstName || ""} ${a.LastName || ""}`.trim(),
          loginid: a.Username,
          UUID: a.UUID
        };
      });
    }

    // Batch get queues
    let queues: Record<string, any> = {};
    if (queueUUIDs.size > 0) {
      const queueParams = {
        RequestItems: {
          TblmstQueue: {
            Keys: Array.from(queueUUIDs).map((uuid) => ({ UUID: uuid }))
          }
        }
      };
      const queueData = await dynamo.batchGet(queueParams).promise();
      queueData.Responses?.TblmstQueue?.forEach((q: any) => {
        queues[q.UUID] = { Names: q.Names };
      });
    }

    // Merge results back
    Object.values(mergedData).forEach((item: any) => {
      if (item.UUID && agents[item.UUID]) {
        item.agentname = agents[item.UUID].agentname;
        item.loginid = agents[item.UUID].loginid;
        item.UUID = agents[item.UUID].UUID;
      }
      if (item.queueArn && queues[item.queueArn]) {
        item.Names = queues[item.queueArn].Names;
      }
    });

    const result = Object.values(mergedData);

    res.status(200).json([
      result,
      [{ count: result.length }],
      result,
      {
        nextToken: data.LastEvaluatedKey
          ? encodeURIComponent(JSON.stringify(data.LastEvaluatedKey))
          : null
      }
    ]);

    if (!data.Items || data.Items.length === 0) {

      //  return res.status(200).json({ message: "No records found" });
      return res.status(200).json([
        result,
        [{ count: result.length }],
        result,
        {
          nextToken: data.LastEvaluatedKey
            ? encodeURIComponent(JSON.stringify(data.LastEvaluatedKey))
            : null
        }
      ]);
    }
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
//Getitng the getrepetitivesummary
app.get("/api/getrepetitivesummary", verifyToken, async (req: any, res: any) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
    fromdate = null,
    todate = null,
    queueid = null,
  } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(
    //     `Exec [USP_Repetitive_report] ${currentPage},${perPage},${searchText !== null ? "'" + searchText + "'" : "NULL"
    //     },${sval !== null ? "'" + sval + "'" : "NULL"},${fromdate !== null ? "'" + fromdate + "'" : "NULL"
    //     },${todate !== null ? "'" + todate + "'" : "NULL"},${queueid !== null ? "'" + queueid + "'" : "NULL"
    //     }`
    //   );
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);

    const timezone: any = req.query.timezone;
    const allTimezones = moment.tz.names();
    const tz: any = allTimezones.includes(timezone) ? timezone : "Asia/Kolkata";

    const page = parseInt(currentPage);
    const limit = parseInt(perPage);
    const start = (page - 1) * limit;

    // Convert to ISO strings for Dynamo
    const fromIso = fromdate
      ? new Date(fromdate).toISOString()
      : "0000-01-01T00:00:00.000Z";
    const toIso = todate
      ? new Date(todate).toISOString()
      : "9999-12-31T23:59:59.999Z";

    // DynamoDB scan with date range
    const params: any = {
      TableName: TABLE_NAME,
      FilterExpression: "#t BETWEEN :from AND :to",
      ExpressionAttributeNames: {
        "#t": "eventTime", // alias reserved word
      },
      ExpressionAttributeValues: {
        ":from": fromIso,
        ":to": toIso,
      },
    };
    const data = await dynamo.scan(params).promise();
    interface CliSummary {
      cli: string;
      count: number;
      contactIds: string[];
    }
    if (!data.Items || data.Items.length === 0) {
      return res.status(200).json([[], [{ count: 0 }], []]);
    }
    // Apply additional filtering (searchText)
    let contacts = data.Items.filter((item: any) => {
      const callTime = item.eventTime ? new Date(item.eventTime) : null;

      if (fromdate && callTime && callTime < new Date(fromdate)) return false;
      if (todate && callTime && callTime > new Date(todate)) return false;

      if (searchText && !String(item?.tags?.CLI || "").includes(searchText)) {
        return false;
      }
      return true;
    });
    const cliMap: Record<string, CliSummary> = {};
    contacts.forEach((item: any) => {
      const cli = item.tags?.CLI;
      const contactId = item.contactId;

      if (cli) {
        if (!cliMap[cli]) {
          cliMap[cli] = { cli, count: 0, contactIds: [] };
        }

        cliMap[cli].count++;
        if (contactId && !cliMap[cli].contactIds.includes(contactId)) {
          cliMap[cli].contactIds.push(contactId);
        }
      }
    });
    // Group by CLI and keep only those with >1 occurrences
    const repetitive = Object.values(cliMap)
      .filter((entry) => entry.count > 1)
      .map((entry) => ({
        id: entry.cli,
        customerNumber: entry.cli,
        "count": entry.contactIds.length,
        fromdate,
        todate,
      }));

    if (repetitive[0].count > 1) {

      // Sort descending by customerNumber
      repetitive.sort((a, b) =>
        a.customerNumber < b.customerNumber ? 1 : -1
      );
      // Pagination
      const paginated = repetitive.slice(start, start + limit);
      // SQL-like response
      res.status(200).json([
        paginated, // dataset
        [{ count: repetitive.length }], // total count
        repetitive.map((r) => ({
          "Caller Number": r.customerNumber,
          "Number of Occurance": r.count,
        })), // occurrence summary
      ]);
    } else {
      res.status(200).json([
        [], // dataset
        [{ count: 0 }], // total count
        [], // occurrence summary
      ]);
    }
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
//Getitng the getrepetitivecalldetails
app.get("/api/getrepetitivecalldetails", verifyToken, async (req: any, res: any) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
    fromdate = null,
    todate = null,
    queueid = null,
    customer = null,
  } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(
    //     `Exec [USP_Repetitive_Calls_Details] ${currentPage},${perPage},${searchText !== null ? "'" + searchText + "'" : "NULL"
    //     },${sval !== null ? "'" + sval + "'" : "NULL"},${fromdate !== null ? "'" + fromdate + "'" : "NULL"
    //     },${todate !== null ? "'" + todate + "'" : "NULL"},${queueid !== null ? "'" + queueid + "'" : "NULL"
    //     },${customer !== null ? "'" + customer + "'" : "NULL"}`
    //   );
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);
    const timezone: any = req.query.timezone || "Asia/Kolkata";
    const allTimezones = moment.tz.names();
    const tz = allTimezones.includes(timezone) ? timezone : "Asia/Kolkata";
    const pageSize = parseInt(perPage as string) || 15;
    const nextToken = req.query.nextToken
      ? JSON.parse(decodeURIComponent(req.query.nextToken as string))
      : null;

    const params: any = {
      TableName: TABLE_NAME,
      Limit: pageSize,
      FilterExpression: "#channel = :voice and attribute_exists(disconnectTimestamp) and attribute_exists(queueInfo)",
      ExpressionAttributeNames: {
        "#channel": "channel",
      },
      ExpressionAttributeValues: {
        ":voice": "VOICE",
      },
    };
    // Add date filters if provided
    if (fromdate && todate) {
      params.FilterExpression += " and connectedToSystemTimestamp between :fromdate and :todate";
      params.ExpressionAttributeValues[":fromdate"] = fromdate;
      params.ExpressionAttributeValues[":todate"] = todate;
    }

    // Add customer filter (only prefix matching natively)
    if (customer) {
      params.FilterExpression += " and begins_with(customerNumber, :cust)";
      params.ExpressionAttributeValues[":cust"] = customer;
    }
    if (nextToken) params.ExclusiveStartKey = nextToken;
    const data = await dynamo.scan(params).promise();
    if (!data.Items || data.Items.length === 0) {
      return res.status(200).json([data.Items || [], [{ count: 0 }], []]);
    }
    // Convert UTC -> TZ
    const toTZ = (utcTime: any) =>
      utcTime ? moment(utcTime).tz(tz).format("YYYY-MM-DD HH:mm:ss") : null;
    const mergedData: any = {};
    data.Items.forEach((item: any) => {
      const contactId = item.contactId;
      if (!mergedData[contactId]) {
        mergedData[contactId] = {
          id: contactId,
          "System Connect Time": null,
          "Queue Start Time": null,
          "Queue End Time": null,
          Type: item.initiationMethod || "INBOUND",
          "Wait Time": null,
          "Talk Time": null,
          AgentName: null,
          "Queue ID": null,
          contactid: contactId,
          "System Endpoint": null,
          "Customer End Point": null,
          channel: item.channel || "VOICE",
          Username: item.username || null,
          agentid: item.agentInfo?.agentArn || null,
        };
      }

      switch (item.eventType) {
        case "COMPLETED":
          mergedData[contactId]["System Connect Time"] = toTZ(item.eventTime);
          break;
        case "QUEUED":
          mergedData[contactId]["Queue Start Time"] = toTZ(item.eventTime);
          break;
        case "INITIATED":
          mergedData[contactId]["Queue End Time"] = toTZ(item.eventTime);
          mergedData[contactId].connectedToAgent = toTZ(item.eventTime);
          break;
        case "DISCONNECTED":
          mergedData[contactId].disconnectedAt = toTZ(item.eventTime);
          break;
      }

      if (item.tags?.DNIS) mergedData[contactId]["System Endpoint"] = item.tags.DNIS;
      if (item.tags?.CLI) mergedData[contactId]["Customer End Point"] = item.tags.CLI;

      if (item.queueInfo?.queueArn)
        mergedData[contactId]["Queue ID"] =
          item.queueInfo.queueArn.match(/queue\/([^/]+)/)?.[1];

      if (item.agentInfo?.name) mergedData[contactId].AgentName = item.agentInfo.name;

      // Calculate times
      const qStart = mergedData[contactId]["Queue Start Time"];
      const aConnect = mergedData[contactId].connectedToAgent;
      const dTime = mergedData[contactId].disconnectedAt;

      if (qStart && aConnect) {
        const waitSec = moment(aConnect).diff(moment(qStart), "seconds");
        mergedData[contactId]["Wait Time"] = moment
          .utc(waitSec * 1000)
          .format("HH:mm:ss");
      }
      if (aConnect && dTime) {
        const talkSec = moment(dTime).diff(moment(aConnect), "seconds");
        mergedData[contactId]["Talk Time"] = moment
          .utc(talkSec * 1000)
          .format("HH:mm:ss");
      }
    });

    // Apply filters like SQL
    let result: any = Object.values(mergedData);

    if (fromdate)
      result = result.filter(
        (r: any) =>
          r["System Connect Time"] &&
          moment(r["System Connect Time"]).isSameOrAfter(moment(fromdate))
      );

    if (todate)
      result = result.filter(
        (r: any) =>
          r["System Connect Time"] &&
          moment(r["System Connect Time"]).isSameOrBefore(moment(todate))
      );

    if (customer)
      result = result.filter((r: any) =>
        r["Customer End Point"]?.includes(customer)
      );

    if (queueid)
      result = result.filter((r: any) =>
        queueid.split(",").includes(r["Queue ID"])
      );

    if (sval)
      result = result.filter((r: any) =>
        sval.split(",").includes(r.Username)
      );

    if (searchText)
      result = result.filter(
        (r: any) =>
          (r.Type && r.Type.includes(searchText)) ||
          (r.AgentName && r.AgentName.includes(searchText)) ||
          (r["Queue ID"] && r["Queue ID"].includes(searchText)) ||
          (r["Customer End Point"] &&
            r["Customer End Point"].includes(searchText))
      );

    // Sort by System Connect Time (desc like SQL)
    result.sort(
      (a: any, b: any) =>
        moment(b["System Connect Time"]).valueOf() -
        moment(a["System Connect Time"]).valueOf()
    );

    // Manual pagination
    const startIndex = (currentPage) * perPage;
    const pagedData = result.slice(startIndex, startIndex + perPage);

    res.status(200).json([
      pagedData,
      [{ count: result.length }],
      result,
    ]);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
// Handle unhandled exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});
const TABLE_NAME = "nayyar";
// Ensure table exists before using
async function ensureTableExists() {
  try {
    await dynamoRaw.describeTable({ TableName: TABLE_NAME }).promise();
    console.log(`✅ Table "${TABLE_NAME}" exists`);
  } catch (err: any) {
    if (err.code === "ResourceNotFoundException") {
      console.log(`⚠️ Table "${TABLE_NAME}" not found — creating...`);
      await dynamoRaw
        .createTable({
          TableName: TABLE_NAME,
          KeySchema: [
            { AttributeName: "contactId", KeyType: "HASH" }, // Partition key
            { AttributeName: "eventTime", KeyType: "RANGE" } // Sort key
          ],
          AttributeDefinitions: [
            { AttributeName: "contactId", AttributeType: "S" },
            { AttributeName: "eventTime", AttributeType: "S" }
          ],
          BillingMode: "PAY_PER_REQUEST",
        })
        .promise();
      console.log(`✅ Table "${TABLE_NAME}" created`);
    } else {
      throw err;
    }
  }
}
// API endpoint
app.get("/api/getcallwebhook", async (req, res) => {
  try {
    await ensureTableExists();
    const detail = req.body.detail;
    if (!detail || !detail.contactId) {
      return res.status(400).json({ error: "Missing contactId in request" });
    }
    const contactId = detail.contactId;
    // Use Amazon Connect's event id or current timestamp as unique sort key
    const eventTime = detail.id || new Date().toISOString();
    await dynamo
      .put({
        TableName: TABLE_NAME,
        Item: {
          contactId,
          eventTime,
          ...detail
        },
      })
      .promise();
    console.log(`✅ Event stored for Contact ${contactId} at ${eventTime}`);
    res.status(200).json({ message: `Event stored for Contact ${contactId}` });
  } catch (err: any) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});
app.post("/api/getcallwebhook", async (req, res) => {
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const request = pool.request();
    const result = await request.query(
      `EXEC usp_insert_contactdetails_log ${"'" + JSON.stringify(req.body) + "'"
      }`
    );
    console.log("SQL query executed successfully.");
    res.json(req.body);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
//Getting the getcontactsummary
app.get("/api/getcontactsummary", verifyToken, async (req: any, res: any) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
    fromdate = null,
    todate = null,
    queueid = null,
  } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(
    //     `Exec USP_getContactsummary ${currentPage},${perPage},${searchText !== null ? "'" + searchText + "'" : "NULL"
    //     },${sval !== null ? "'" + sval + "'" : "NULL"},${fromdate !== null ? "'" + fromdate + "'" : "NULL"
    //     },${todate !== null ? "'" + todate + "'" : "NULL"},${queueid !== null ? "'" + queueid + "'" : "NULL"
    //     }`
    //   );
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);

    const timezone: any = req.query.timezone;
    const pageSize = parseInt(req.query.pageSize as string) || 100;
    const nextToken = req.query.nextToken
      ? JSON.parse(decodeURIComponent(req.query.nextToken as string))
      : null;

    const allTimezones = moment.tz.names();
    const tz: any = allTimezones.includes(timezone) ? timezone : "Asia/Kolkata";

    const params: any = {
      TableName: TABLE_NAME,
      Limit: pageSize,
      FilterExpression:
        "#eventType IN (:queued, :completed, :initiated, :disconnected)",
      ExpressionAttributeNames: {
        "#eventType": "eventType",
      },
      ExpressionAttributeValues: {
        ":queued": "QUEUED",
        ":completed": "COMPLETED",
        ":initiated": "INITIATED",
        ":disconnected": "DISCONNECTED",
      },
    };

    if (nextToken) {
      params.ExclusiveStartKey = nextToken;
    }

    const data = await dynamo.scan(params).promise();
    // if (!data.Items || data.Items.length === 0) {
    //   return res.status(200).json({ message: "No records found" });
    // }


    const mergedData: any = {};
    data.Items.forEach((item: any) => {
      const contactId = item.contactId;
      if (!mergedData[contactId]) {
        mergedData[contactId] = {
          id: contactId,
          contactid: contactId,
          account: item.account || null,
          source: item.source || null,
          time: item.time || null,
          eventtype: item.eventType || null,
          initiationMethod: item.initiationMethod || null,
          channel: item.channel || null,
          initiationTimeStamp: null,
          connectedtosystemtimestamp: null,
          disconnectTimeStamp: null,
          customerNumber: null,
          dnis: null,
          queueArn: null,
          agentArn: null,
          connectedtoTimeagenttimestamp: null,
          queueid: item.queueid || null,
          Username: null,
          val1: null,
          val: null,
        };
      }

      const toTZ = (utcTime: any) =>
        utcTime
          ? moment(utcTime).tz(tz).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]")
          : null;

      switch (item.eventType) {
        case "INITIATED":
          mergedData[contactId].initiationTimeStamp = toTZ(item.eventTime);
          mergedData[contactId].time = toTZ(item.eventTime);
          break;
        case "CONNECTED_TO_SYSTEM":
          mergedData[contactId].connectedtosystemtimestamp = toTZ(item.eventTime);
          break;
        case "CONNECTED_TO_AGENT":
          mergedData[contactId].connectedtoTimeagenttimestamp = toTZ(
            item.eventTime
          );
          break;
        case "DISCONNECTED":
          mergedData[contactId].disconnectTimeStamp = toTZ(item.eventTime);
          break;
      }

      if (item.tags?.CLI) mergedData[contactId].customerNumber = item.tags.CLI;
      if (item.tags?.DNIS) mergedData[contactId].dnis = item.tags.DNIS;
      if (item.queueInfo?.queueArn?.match(/queue\/([^/]+)/)?.[1])
        mergedData[contactId].queueArn =
          item.queueInfo.queueArn.match(/queue\/([^/]+)/)?.[1] || null;
      if (item.agentInfo?.agentArn?.match(/agent\/([^/]+)/)?.[1])
        mergedData[contactId].agentArn =
          item.agentInfo.agentArn.match(/agent\/([^/]+)/)?.[1] || null;
      if (item.username) mergedData[contactId].Username = item.username;
    });

    const agentUUIDs = new Set<string>();
    const queueUUIDs = new Set<string>();

    Object.values(mergedData).forEach((item: any) => {
      if (item.agentArn) agentUUIDs.add(item.agentArn);
      if (item.queueArn) queueUUIDs.add(item.queueArn);
    });

    // Batch get agents
    let agents: Record<string, any> = {};
    if (agentUUIDs.size > 0) {
      const agentParams = {
        RequestItems: {
          TblmstAgentSummary: {
            Keys: Array.from(agentUUIDs).map((uuid) => ({ UUID: uuid }))
          }
        }
      };
      const agentData = await dynamo.batchGet(agentParams).promise();
      agentData.Responses?.TblmstAgentSummary?.forEach((a: any) => {
        agents[a.UUID] = {
          agentname: `${a.FirstName || ""} ${a.LastName || ""}`.trim(),
          loginid: a.Username,
          UUID: a.UUID
        };
      });
    }

    // Batch get queues
    let queues: Record<string, any> = {};
    if (queueUUIDs.size > 0) {
      const queueParams = {
        RequestItems: {
          TblmstQueue: {
            Keys: Array.from(queueUUIDs).map((uuid) => ({ UUID: uuid }))
          }
        }
      };
      const queueData = await dynamo.batchGet(queueParams).promise();
      queueData.Responses?.TblmstQueue?.forEach((q: any) => {
        queues[q.UUID] = { Names: q.Names };
      });
    }

    // Merge results back
    Object.values(mergedData).forEach((item: any) => {
      if (item.agentArn) {
        item.agentArn = agents[item.agentArn].agentname;
      }
      if (item.queueArn && queues[item.queueArn]) {
        item.queueArn = queues[item.queueArn].Names;
      }
    });

    let result = Object.values(mergedData);


    // ✅ Apply filters after merging
    // let result: any[] = Object.values(mergedData);


    // Date range filter
    if (fromdate && todate) {
      result = result.filter((r: any) => {
        if (!r.time) return false;
        const eventTime = moment(r.time);
        return (
          eventTime.isSameOrAfter(moment(fromdate)) &&
          eventTime.isSameOrBefore(moment(todate))
        );
      });
    }

    // Queue filter
    if (queueid) {
      const queueIds = queueid.split(",").map((id: string) => id.trim());
      result = result.filter((r: any) => queueIds.includes(r.queueArn));
    }


    // Search filter (can search in Username or customerNumber or dnis)
    if (searchText) {
      const lowerSearch = String(searchText).toLowerCase();
      result = result.filter(
        (r: any) =>
          (r.Username && r.Username.toLowerCase().includes(lowerSearch)) ||
          (r.customerNumber &&
            r.customerNumber.toLowerCase().includes(lowerSearch)) ||
          (r.dnis && r.dnis.toLowerCase().includes(lowerSearch))
      );
    }

    // sval filter (example: matches val1 or val field)
    if (sval) {
      result = result.filter(
        (r: any) =>
          (r.val1 && r.val1.toString().includes(sval)) ||
          (r.val && r.val.toString().includes(sval))
      );
    }

    // Pagination (currentPage, perPage)
    const startIndex = (Number(currentPage + 1) - 1) * Number(perPage);
    const paginatedData = result.slice(startIndex, startIndex + Number(perPage));

    if (!data.Items || data.Items.length === 0) {

      //  return res.status(200).json({ message: "No records found" });
      return res.status(200).json([
        result,
        [{ count: result.length }],
        result,
        {
          nextToken: data.LastEvaluatedKey
            ? encodeURIComponent(JSON.stringify(data.LastEvaluatedKey))
            : null
        }
      ]);
    }

    res.status(200).json([
      result,
      [{ count: result.length }],
      result, // full filtered data if needed
      paginatedData,
      {
        nextToken: data.LastEvaluatedKey
          ? encodeURIComponent(JSON.stringify(data.LastEvaluatedKey))
          : null,
      },
    ]);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// get time zone
app.get("/api/gettimezone", verifyToken, async (req, res) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
    fromdate = null,
    todate = null,
    queueid = null,
  } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool.request().query(`Exec usp_gettimezone`);
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);
    const params = {
      TableName: "tblmst_timezone",
    }
    const result = await dynamo.scan(params).promise();
    const mergedData: Record<string, any> = {};
    result.Items.forEach((s: any) => {
      const id = s.Id
      mergedData[id] = {
        id: '',
        timezone: '',
      }
      mergedData[id].id = s.Id,
        mergedData[id].timezone = s.timeZone
    });
    const data = Object.values(mergedData);
    res.json([
      data
    ])
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// insert timezone
app.post("/api/inserttimezone", verifyToken, async (req, res) => {
  const { loginid = null, timezoneid = null } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(
    //     `Exec usp_inserttimezone ${loginid !== null ? "'" + loginid + "'" : "NULL"
    //     },${timezoneid !== null ? "'" + timezoneid + "'" : "NULL"}`
    //   );
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);

    const userRes = await dynamo.scan({
      TableName: "tbltrn_userbytimezone",
      FilterExpression: "userid = :u",
      ExpressionAttributeValues: { ":u": loginid }
    }).promise();

    if (userRes.Items.length > 0) {
      // Step 2: Update the first matching record (assuming 1 per userid)
      const item = userRes.Items[0];
      const updateParams = {
        TableName: "tbltrn_userbytimezone",
        Key: { id: item.id }, // use actual PK
        UpdateExpression: "set timezoneid = :tz",
        ExpressionAttributeValues: { ":tz": timezoneid },
        ReturnValues: "ALL_NEW"
      };

      const result = await dynamo.update(updateParams).promise();
      console.log("Updated:", result.Attributes);
      return result.Attributes;

    } else {
      // Step 3: Insert new record
      const newItem = {
        id: AWS.util.uuid.v4(), // generate new PK
        userid: loginid,
        timezoneid: timezoneid
      };
      await dynamo.put({ TableName: "tbltrn_userbytimezone", Item: newItem }).promise();
      console.log("Inserted:", newItem);
      return newItem;
    }
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// get userwisetime zone
app.get("/api/getuserwisetimezone", async (req, res) => {
  const { loginid = null } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool.request().query(`Exec usp_getuserwisetimezone ${loginid !== null ? "'" + loginid + "'" : "NULL"}`);
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);

    const userRes = await dynamo.scan({
      TableName: "tbltrn_userbytimezone",
      FilterExpression: "userid = :u",
      ExpressionAttributeValues: { ":u": loginid }
    }).promise();

    if (!userRes.Items) {
      throw new Error(`No timezone mapping found for userId: ${loginid}`);
    }
    const timezoneId = userRes.Items[0].timezoneid;
    // Step 2: Get timezone string using timezoneId
    const tzRes = await dynamo.get({
      TableName: "tblmst_timezone",
      Key: { Id: Number(timezoneId) }
    }).promise();

    if (!tzRes.Item) {
      throw new Error(`No timezone found for timezoneId: ${timezoneId}`);
    }
    const data = [{
      timezoneid: timezoneId,
      TimeZone: tzRes.Item.timeZone
    }];
    res.json([data]);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});

// get // not to be used
app.get("/api/getqueuedetails", verifyToken, async (req, res) => {
  const { count = null, channel = null } = req.query;
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool
      .request()
      .query(
        `Exec usp_getqueuedetails ${count !== null ? "'" + count + "'" : "NULL"
        },${channel !== null ? "'" + channel + "'" : "NULL"}`
      );
    console.log("SQL query executed successfully.");
    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});

app.get("/api/getcalljourney", verifyToken, async (req: any, res: any) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
    fromdate = null,
    todate = null,
    queueid = null,
  } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(
    //     `Exec usp_getcalljourney ${currentPage},${perPage},${searchText !== null ? "'" + searchText + "'" : "NULL"
    //     },${sval !== null ? "'" + sval + "'" : "NULL"},${fromdate !== null ? "'" + fromdate + "'" : "NULL"
    //     },${todate !== null ? "'" + todate + "'" : "NULL"},${queueid !== null ? "'" + queueid + "'" : "NULL"
    //     }`
    //   );
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);

    const timezone: any = req.query.timezone;
    const pageSize = parseInt(req.query.pageSize as string) || 100;
    const nextToken = req.query.nextToken
      ? JSON.parse(decodeURIComponent(req.query.nextToken as string))
      : null;

    const allTimezones = moment.tz.names();
    const tz: any = allTimezones.includes(timezone) ? timezone : "Asia/Kolkata";

    const params: any = {
      TableName: TABLE_NAME,
      Limit: pageSize
    };

    if (nextToken) {
      params.ExclusiveStartKey = nextToken;
    }

    const data = await dynamo.scan(params).promise();


    if (!data.Items || data.Items.length === 0) {
      return res.status(200).json({ message: "No records found" });
    }


    const mergedData: any = {};
    data.Items.forEach((item: any) => {
      const contactId = item.contactId;
      if (!mergedData[contactId]) {
        mergedData[contactId] = {
          id: contactId,
          contactid: contactId,
          "Start Contact": item.time || null,
          "Add Call Info": item.time || null,
          "IVR START": item.time || null,
          connectedtoAgentTimestamp: item.time || null,
          disconnectTimeStamp: item.time || null,
          customerNumber: item.tags.CLI || null,
          Names: item.name || null,
          dnis: item.tags.DNIS,
          agentName: null,
          username: null,
          queueName: null,
          time: item.eventTime || null,
        };
      }

      const toTZ = (utcTime: any) =>
        utcTime
          ? moment(utcTime).tz(tz).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]")
          : null;

      switch (item.eventType) {
        case "INITIATED":
          mergedData[contactId]["Start Contact"] = toTZ(item.eventTime);
          break;
        case "CONTACT_DATA_UPDATED":
          mergedData[contactId]["Add Call Info"] = toTZ(item.eventTime);
          break;
        case "CONNECTED_TO_SYSTEM":
          mergedData[contactId]["IVR START"] = toTZ(item.eventTime);
          break;
        case "CONNECTED_TO_AGENT":
          mergedData[contactId].connectedtoAgentTimestamp = toTZ(item.eventTime);
          break;
        case "DISCONNECTED":
          mergedData[contactId].disconnectTimeStamp = toTZ(item.eventTime);
          break;
      }

      if (item.tags?.CLI) mergedData[contactId].customerNumber = item.tags.CLI;
      if (item.tags?.DNIS) mergedData[contactId].dnis = item.tags.DNIS;
      if (item.queueInfo?.queueArn?.match(/queue\/([^/]+)/)?.[1])
        mergedData[contactId].queueArn =
          item.queueInfo.queueArn.match(/queue\/([^/]+)/)?.[1] || null;
      if (item.agentInfo?.agentArn?.match(/agent\/([^/]+)/)?.[1])
        mergedData[contactId].agentArn =
          item.agentInfo.agentArn.match(/agent\/([^/]+)/)?.[1] || null;
      if (item.username) mergedData[contactId].Username = item.username;
    });

    const agentUUIDs = new Set<string>();
    const queueUUIDs = new Set<string>();

    Object.values(mergedData).forEach((item: any) => {
      if (item.agentArn) agentUUIDs.add(item.agentArn);
      if (item.queueArn) queueUUIDs.add(item.queueArn);
    });

    // Batch get agents
    let agents: Record<string, any> = {};
    if (agentUUIDs.size > 0) {
      const agentParams = {
        RequestItems: {
          TblmstAgentSummary: {
            Keys: Array.from(agentUUIDs).map((uuid) => ({ UUID: uuid }))
          }
        }
      };
      const agentData = await dynamo.batchGet(agentParams).promise();
      agentData.Responses?.TblmstAgentSummary?.forEach((a: any) => {
        agents[a.UUID] = {
          agentname: `${a.FirstName || ""} ${a.LastName || ""}`.trim(),
          loginid: a.Username,
          UUID: a.UUID
        };
      });
    }

    // Batch get queues
    let queues: Record<string, any> = {};
    if (queueUUIDs.size > 0) {
      const queueParams = {
        RequestItems: {
          TblmstQueue: {
            Keys: Array.from(queueUUIDs).map((uuid) => ({ UUID: uuid }))
          }
        }
      };
      const queueData = await dynamo.batchGet(queueParams).promise();
      queueData.Responses?.TblmstQueue?.forEach((q: any) => {
        queues[q.UUID] = { Names: q.Names };
      });
    }

    // Merge results back
    Object.values(mergedData).forEach((item: any) => {
      if (item.agentArn) {
        item.agentname = agents[item.agentArn].agentname;
      }
      if (item.queueArn && queues[item.queueArn]) {
        item.Names = queues[item.queueArn].Names;
      }
    });

    let result = Object.values(mergedData);

    if (!data.Items || data.Items.length === 0) {
      //  return res.status(200).json({ message: "No records found" });
      res.status(200).json([
        result,
        [{ count: result.length }],
        result,
        {
          nextToken: data.LastEvaluatedKey
            ? encodeURIComponent(JSON.stringify(data.LastEvaluatedKey))
            : null
        }
      ]);
    }


    // Date range filter
    if (fromdate && todate) {
      result = result.filter((r: any) => {
        if (!r.time) return false;
        const eventTime = moment(r.time);
        return (
          eventTime.isSameOrAfter(moment(fromdate)) &&
          eventTime.isSameOrBefore(moment(todate))
        );
      });
    }
    // Queue filter
    if (queueid) {
      const queueIds = queueid.split(",").map((id: string) => id.trim());
      result = result.filter((r: any) => queueIds.includes(r.queueArn));
    }


    // Search filter (can search in Username or customerNumber or dnis)
    if (searchText) {
      const lowerSearch = String(searchText).toLowerCase();
      result = result.filter(
        (r: any) =>
          (r.Username && r.Username.toLowerCase().includes(lowerSearch)) ||
          (r.customerNumber &&
            r.customerNumber.toLowerCase().includes(lowerSearch)) ||
          (r.dnis && r.dnis.toLowerCase().includes(lowerSearch))
      );
    }

    // sval filter (example: matches val1 or val field)
    if (sval) {
      result = result.filter(
        (r: any) =>
          (r.val1 && r.val1.toString().includes(sval)) ||
          (r.val && r.val.toString().includes(sval))
      );
    }

    // Pagination (currentPage, perPage)
    const startIndex = (Number(currentPage + 1) - 1) * Number(perPage);
    const paginatedData = result.slice(startIndex, startIndex + Number(perPage));

    res.status(200).json([
      paginatedData,
      [{ count: result.length }],
      result, // full filtered data if needed
      {
        nextToken: data.LastEvaluatedKey
          ? encodeURIComponent(JSON.stringify(data.LastEvaluatedKey))
          : null,
      },
    ]);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});

function secondsToHHMMSS(sec: number) {
  if (!sec || isNaN(sec)) return "00:00:00";
  const h = Math.floor(sec / 3600).toString().padStart(2, "0");
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}
app.get("/api/getagentcomparison", verifyToken, async (req, res) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
    fromdate = null,
    todate = null,
    queueid = null,
  } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(
    //     `Exec USP_GetAgentComparison ${sval !== null ? "'" + sval + "'" : "NULL"
    //     },${fromdate !== null ? "'" + fromdate + "'" : "NULL"},${todate !== null ? "'" + todate + "'" : "NULL"
    //     },${queueid !== null ? "'" + queueid + "'" : "NULL"}`
    //   );
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);

    const usernames = sval ? String(sval).split(",").filter((v: any) => v) : [];
    const queueIds = queueid ? String(queueid).split(",").filter((v: any) => v) : [];

    // ---- Step 1: Scan metrics table (agent transactions) ----
    const metricParams: any = {
      TableName: "TbltrnHistoricalAgent",
      FilterExpression: "#date BETWEEN :from AND :to",
      ExpressionAttributeNames: { "#date": "StartTime" },
      ExpressionAttributeValues: { ":from": fromdate, ":to": todate },
    };

    let items: any[] = [];
    let result;
    result = await dynamo.scan(metricParams).promise();
    items = items.concat(result.Items || []);


    // ---- Step 2: Scan tbmst_Agentsummary (metadata) ----
    const agentParams: any = { TableName: "TblmstAgentSummary" };
    let agentItems: any[] = [];
    let agentResult;

    agentResult = await dynamo.scan(agentParams).promise();
    agentItems = agentItems.concat(agentResult.Items || []);

    // ---- Step 3: Apply queue filter if provided ----
    // simulate JOIN with tmst_route_queues + filter queueIds
    // for simplicity assume tbmst_Agentsummary contains RoutingProfileId
    let validAgents = agentItems;
    if (queueIds.length > 0) {
      // fetch tmst_route_queues
      const queueParams: any = { TableName: "TblmstRoutingQueue" };
      let queueItems: any[] = [];
      let queueResult;
      do {
        queueResult = await dynamo.scan(queueParams).promise();
        queueItems = queueItems.concat(queueResult.Items || []);
        queueParams.ExclusiveStartKey = queueResult.LastEvaluatedKey;
      } while (queueResult.LastEvaluatedKey);

      // filter agentIds that are in provided queueIds
      const validRouteProfiles = queueItems
        .filter((q) => queueIds.includes(String(q.QueueId)))
        .map((q) => q.RouteProfileId);

      validAgents = agentItems.filter((a) =>
        validRouteProfiles.includes(a.RoutingProfileId)
      );
    }

    const validAgentUUIDs = new Set(validAgents.map((a) => a.UUID));

    // ---- Step 4: Aggregate per agent (only valid agents) ----
    const aggregated: any = {};
    items.forEach((item: any) => {
      if (!validAgentUUIDs.has(item.Agentid)) return; // enforce join filter

      const key = item.Agentid;
      if (!aggregated[key]) {
        const meta = validAgents.find((a) => a.UUID === item.Agentid) || {};
        aggregated[key] = {
          Username: meta.Username || item.Username,
          UUID: item.Agentid,
          CONTACTS_HANDLED: 0,
          Agent_non_response: 0,
          sum_idle_time_agent: 0,
          sum_contact_time_agent: 0,
          SUM_NON_PRODUCTIVE_TIME_AGENT: 0,
          sum_online_time_AGENT: 0,
          CONTACTS_PUT_ON_HOLD: 0,
          CONTACTS_TRANSFERRED_OUT_BY_AGENT: 0,
          CONTACTS_TRANSFERRED_OUT_EXTERNAL: 0,
          CONTACTS_TRANSFERRED_OUT_INTERNAL: 0,
          StartTime: item.StartTime,
          EndTime: item.EndTime,
        };
      }

      aggregated[key].CONTACTS_HANDLED += item.CONTACTS_HANDLED || 0;
      aggregated[key].Agent_non_response += item.AGENT_NON_RESPONSE || 0;
      aggregated[key].sum_idle_time_agent += item.sum_idle_time_agent || 0;
      aggregated[key].sum_contact_time_agent += item.sum_contact_time_agent || 0;
      aggregated[key].SUM_NON_PRODUCTIVE_TIME_AGENT += item.SUM_NON_PRODUCTIVE_TIME_AGENT || 0;
      aggregated[key].sum_online_time_AGENT += item.sum_online_time_AGENT || 0;
      aggregated[key].CONTACTS_PUT_ON_HOLD += item.CONTACTS_PUT_ON_HOLD || 0;
      aggregated[key].CONTACTS_TRANSFERRED_OUT_BY_AGENT += item.CONTACTS_TRANSFERRED_OUT_BY_AGENT || 0;
      aggregated[key].CONTACTS_TRANSFERRED_OUT_EXTERNAL += item.CONTACTS_TRANSFERRED_OUT_EXTERNAL || 0;
      aggregated[key].CONTACTS_TRANSFERRED_OUT_INTERNAL += item.CONTACTS_TRANSFERRED_OUT_INTERNAL || 0;


      aggregated[key].wrapNumerator = (aggregated[key].wrapNumerator || 0) +
        (item.AVG_AFTER_CONTACT_WORK_TIME || 0) * (item.CONTACTS_HANDLED || 0);

      aggregated[key].wrapDenominator = (aggregated[key].wrapDenominator || 0) +
        (item.CONTACTS_HANDLED || 0);

      aggregated[key].intNumerator = (aggregated[key].intNumerator || 0) +
        ((item.AVG_INTERACTION_AND_HOLD_TIME || 0) - (item.AVG_HOLD_TIME || 0) * (item.CONTACTS_HANDLED || 0));

      aggregated[key].intDenominator = (aggregated[key].intDenominator || 0) +
        (item.CONTACTS_HANDLED || 0);

      if ((item.AVG_HOLD_TIME || 0) > 0) {
        aggregated[key].holdNumerator = (aggregated[key].holdNumerator || 0) +
          (item.AVG_HOLD_TIME || 0) * (item.CONTACTS_HANDLED || 0);

        aggregated[key].holdDenominator = (aggregated[key].holdDenominator || 0) +
          (item.CONTACTS_HANDLED || 0);
      }

      aggregated[key].handNumerator = (aggregated[key].handNumerator || 0) +
        (item.AVG_HANDLE_TIME || 0) * (item.CONTACTS_HANDLED || 0);

      aggregated[key].handDenominator = (aggregated[key].handDenominator || 0) +
        (item.CONTACTS_HANDLED || 0);


      // update start/end
      if (new Date(item.StartTime) < new Date(aggregated[key].StartTime)) {
        aggregated[key].StartTime = item.StartTime;
      }
      if (new Date(item.EndTime) > new Date(aggregated[key].EndTime)) {
        aggregated[key].EndTime = item.EndTime;
      }
    });

    // ---- Step 5: Finalize metrics ----
    const processed = Object.values(aggregated).map((agent: any) => {
      const total = agent.CONTACTS_HANDLED + agent.Agent_non_response;
      const AGENT_ANSWER_RATE =
        total === 0 ? 0 : (agent.CONTACTS_HANDLED / total) * 100;


      const avgWrap =
        agent.wrapDenominator > 0 ? agent.wrapNumerator / agent.wrapDenominator : 0;

      const avgInt =
        agent.intDenominator > 0 ? agent.intNumerator / agent.intDenominator : 0;

      const avgHold =
        agent.holdDenominator > 0 ? agent.holdNumerator / agent.holdDenominator : 0;

      const avgHand =
        agent.handDenominator > 0 ? agent.handNumerator / agent.handDenominator : 0;


      return {
        ...agent,
        AGENT_ANSWER_RATE: Number(AGENT_ANSWER_RATE.toFixed(2)),
        dates: agent.StartTime.replace(' ', 'T'),
        ["AVG Wrap"]: secondsToHHMMSS(avgWrap),
        ["AVG Int"]: secondsToHHMMSS(avgInt),
        ["AVG Hold"]: secondsToHHMMSS(avgHold),
        ["AVG Hand"]: secondsToHHMMSS(avgHand),
      };
    });

    // ---- Step 6: Apply username filter ----
    const filtered = usernames.length
      ? processed.filter((a: any) => usernames.includes(a.Username))
      : processed;

    // ---- Step 7: Sort & paginate ----
    const sorted = (filtered as any[]).sort((a, b) =>
      a.Username.localeCompare(b.Username)
    );
    const start = (Number(currentPage) - 1) * Number(perPage);
    const paginated = sorted.slice(start, start + Number(perPage));

    res.json([
      paginated,
      paginated,
      [{ count: sorted.length }]
    ]);


  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});

function formatSeconds(seconds: any) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

app.get("/api/getagentperfo", verifyToken, async (req, res) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
    fromdate = null,
    todate = null,
    queueid = null,
  } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(
    //     `Exec [usp_getagentperformance] ${currentPage !== null ? "'" + currentPage + "'" : "NULL"
    //     },${perPage !== null ? "'" + perPage + "'" : "NULL"},${searchText !== null ? "'" + searchText + "'" : "NULL"
    //     },${sval !== null ? "'" + sval + "'" : "NULL"},${fromdate !== null ? "'" + fromdate + "'" : "NULL"
    //     },${queueid !== null ? "'" + queueid + "'" : "NULL"}`
    //   );
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);

    // 1️⃣ Fetch agent data
    const params = {
      TableName: "TbltrnHistoricalAgent",
      FilterExpression: "#st BETWEEN :from AND :to",
      ExpressionAttributeNames: { "#st": "StartTime" },
      ExpressionAttributeValues: {
        ":from": fromdate,
        ":to": todate,
      },
    };

    let items: any = [];

    const data = await dynamo.scan(params).promise();
    items = items.concat(data.Items);

    // 2️⃣ Fetch agent summary
    const agentSummary = await dynamo.scan({ TableName: "TblmstAgentSummary" }).promise();
    const agentMap: any = {};
    for (const a of agentSummary.Items) {
      agentMap[a.UUID] = a;
    }

    // 3️⃣ Aggregate metrics
    const grouped: any = {};
    for (const rec of items) {
      const uuid = rec.Agentid;
      const username = agentMap[uuid]?.Username || "Unknown";

      if (!grouped[uuid]) {
        grouped[uuid] = {
          username,
          uuid,
          contacts: [],
          avgHandle: [],
          weekly: {},
          monthly: {}
        };
      }

      const contacts = Number(rec.CONTACTS_HANDLED || 0);
      const avgHandle = Number(rec.AVG_HANDLE_TIME || 0);
      const totalTime = contacts * avgHandle;
      const start = new Date(rec.StartTime);
      const { parseISO, getISOWeek, getMonth, getYear } = require("date-fns");

      // --- Daily totals ---
      grouped[uuid].contacts.push(contacts);
      grouped[uuid].avgHandle.push(totalTime);

      // --- Weekly aggregation ---
      const weekKey = `${getYear(start)}-W${getISOWeek(start)}`;
      if (!grouped[uuid].weekly[weekKey]) {
        grouped[uuid].weekly[weekKey] = { contacts: 0, time: 0 };
      }
      grouped[uuid].weekly[weekKey].contacts += contacts;
      grouped[uuid].weekly[weekKey].time += totalTime;

      // --- Monthly aggregation ---
      const monthKey = `${getYear(start)}-M${getMonth(start) + 1}`;
      if (!grouped[uuid].monthly[monthKey]) {
        grouped[uuid].monthly[monthKey] = { contacts: 0, time: 0 };
      }
      grouped[uuid].monthly[monthKey].contacts += contacts;
      grouped[uuid].monthly[monthKey].time += totalTime;
    }

    // 4️⃣ Compute result
    const result = Object.values(grouped).map((agent: any) => {
      const totalContacts = agent.contacts.reduce((a: any, b: any) => a + b, 0);
      const avgDailyHandle = totalContacts > 0
        ? agent.avgHandle.reduce((a: any, b: any) => a + b, 0) / totalContacts
        : 0;

      // --- Weekly average: take previous week (like SQL DATEPART(week,@FromDate)-1) ---
      const lastWeekKey = Object.keys(agent.weekly).sort().pop(); // pick latest week
      let avgWeeklyHandle = 0, weekContacts = 0;
      if (lastWeekKey) {
        const w = agent.weekly[lastWeekKey];
        avgWeeklyHandle = w.contacts > 0 ? w.time / w.contacts : 0;
        weekContacts = w.contacts;
      }

      // --- Monthly average: take previous month (like SQL DATEPART(month,@FromDate)-1) ---
      const lastMonthKey = Object.keys(agent.monthly).sort().pop(); // pick latest month
      let avgMonthlyHandle = 0, monthContacts = 0;
      if (lastMonthKey) {
        const m = agent.monthly[lastMonthKey];
        avgMonthlyHandle = m.contacts > 0 ? m.time / m.contacts : 0;
        monthContacts = m.contacts;
      }

      return {
        Username: agent.username,
        UUID: agent.uuid,
        avg_D_handle: formatSeconds(avgDailyHandle),
        contact_D_handle: totalContacts,
        contact_W_handle: weekContacts,
        contact_M_handle: monthContacts,
        id: agent.uuid,
      };
    });

    // 5️⃣ Pagination
    // const start = (currentPage - 1) * perPage;
    // const paginated = result.slice(start, start + currentPage);
    const paginated = result;
    res.json([
      paginated,
      [{ count: paginated.length }],
      paginated
    ]);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});

// app.get("/api/getagentsla", verifyToken, async (req, res) => {
//   const {
//     currentPage = 1,
//     perPage = 7,
//     searchText = null,
//     sval = null,
//     fromdate = null,
//     todate = null,
//     queueid = null,
//     type = null,
//   } = req.query;
//   try {
//     // const pool = await poolPromise;
//     // console.log("Connected to the database.");
//     // const result = await pool
//     //   .request()
//     //   .query(
//     //     `Exec [usp_getagentsla] ${currentPage !== null ? "'" + currentPage + "'" : "NULL"
//     //     },${perPage !== null ? "'" + perPage + "'" : "NULL"},${searchText !== null ? "'" + searchText + "'" : "NULL"
//     //     },${sval !== null ? "'" + sval + "'" : "NULL"},${fromdate !== null ? "'" + fromdate + "'" : "NULL"
//     //     },${todate !== null ? "'" + todate + "'" : "NULL"},${queueid !== null ? "'" + queueid + "'" : "NULL"
//     //     },${type !== null ? "'" + type + "'" : "NULL"}`
//     //   );
//     // console.log("SQL query executed successfully.");
//     // res.json(result.recordsets);

//     // Parse filters
//     const agents = sval ? String(sval).split(",").filter(v => v) : [];
//     const queues = queueid ? String(queueid).split(",").filter(v => v) : [];

//     const agentSummary = await dynamo.scan({ TableName: "TblmstAgentSummary" }).promise();
//     const queueMeta = await dynamo.scan({ TableName: "TblmstQueue" }).promise();


//     // Scan DynamoDB for contact data
//     const params = {
//       TableName: "nayyar",
//       FilterExpression: "#event = :queued AND #time BETWEEN :from AND :to",
//       ExpressionAttributeNames: {
//         "#event": "eventType",
//         "#time": "eventTime"
//       },
//       ExpressionAttributeValues: {
//         ":queued": "QUEUED",
//         ":from": fromdate,
//         ":to": todate
//       }
//     };

//     const result = await dynamo.scan(params).promise();
//     let items = result.Items || [];

//     // Filter by agent/queue if provided
//     if (agents.length > 0 && !agents.includes("1")) {
//       items = items.filter((i: any) => agents.includes(i.Username));
//     }
//     if (queues.length > 0 && !queues.includes("1")) {
//       items = items.filter((i: any) => queues.includes(i.queueInfo.queueArn.split('queue/')[1]));
//     }

//     // --- Grouping Logic ---
//     const grouped: any = {};

//     items.forEach((item: any) => {
//       let key;
//       if (Number(type) == 1) key = item?.agentInfo?.agentArn.split('agent/')[1] || '';                 // Agent wise
//       else if (Number(type) == 2) key = item?.queueInfo?.queueArn.split('queue/')[1] || '';            // Queue wise
//       else key = item?.agentInfo?.agentArn.split('agent/')[1] + "_" + item?.queueInfo?.queueArn.split('queue/')[1];     // Agent+Queue wise

//       if (!grouped[key]) {
//         grouped[key] = {
//           Username: item.Username,
//           Names: item.Names,
//           agentArn: item.agentArn,
//           queueArn: item.queueArn,
//           total: 0,
//           answered: 0,
//           sumSpeedToAnswer: 0,
//           sla: { 15: 0, 20: 0, 30: 0, 60: 0, 90: 0, 120: 0, 180: 0 }
//         };
//       }

//       const g = grouped[key];
//       g.total++;

//       // Calculate DATEDIFF seconds
//       const qStart = new Date(item.queue_start).getTime();
//       const disconnect = new Date(item.disconnectTimeStamp).getTime();
//       const connAgent = item.connectedtoTimeagenttimestamp ? new Date(item.connectedtoTimeagenttimestamp).getTime() : null;
//       const connSystem = item.connectedtosystemtimestamp ? new Date(item.connectedtosystemtimestamp).getTime() : null;

//       let speedToAnswer = null;
//       if (Number(type) == 1) {
//         // In SQL: DATEDIFF(SECOND, queue_start, disconnectTimeStamp)
//         if (qStart && disconnect) {
//           speedToAnswer = (disconnect - qStart) / 1000;
//         }
//       } else {
//         // In SQL: DATEDIFF(SECOND, queue_start, connectedtoTimeagenttimestamp)
//         if (qStart && connAgent) {
//           speedToAnswer = (connAgent - qStart) / 1000;
//         }
//       }

//       if (speedToAnswer != null) {
//         g.sumSpeedToAnswer += speedToAnswer;
//       }

//       if (connAgent) g.answered++;

//       // SLA checks (SQL used DATEDIFF)
//       const baseDiff = connSystem && disconnect ? (disconnect - connSystem) / 1000 : null;
//       const diff = connAgent ? (connAgent - qStart) / 1000 : null;

//       if (Number(type) == 1 && baseDiff != null) {
//         if (baseDiff >= 15) g.sla[15]++;
//         if (baseDiff >= 20) g.sla[20]++;
//         if (baseDiff >= 30) g.sla[30]++;
//         if (baseDiff >= 60) g.sla[60]++;
//         if (baseDiff >= 90) g.sla[90]++;
//         if (baseDiff >= 120) g.sla[120]++;
//         if (baseDiff >= 180) g.sla[180]++;
//       }
//       if (Number(type) != 1 && diff != null) {
//         if (diff >= 15) g.sla[15]++;
//         if (diff >= 20) g.sla[20]++;
//         if (diff >= 30) g.sla[30]++;
//         if (diff >= 60) g.sla[60]++;
//         if (diff >= 90) g.sla[90]++;
//         if (diff >= 120) g.sla[120]++;
//         if (diff >= 180) g.sla[180]++;
//       }
//     });

//     // --- Finalize ---
//     let processed = Object.values(grouped).map((g: any) => {
//       const avgSpeedToAnswer = g.total > 0 ? g.sumSpeedToAnswer / g.total : 0;
//       // Build lookup maps
//       const agentSummaryMap : any = {};
//       agentSummary.Items.forEach((a:any) => { agentSummaryMap[a.UUID ] = a; });

//       const queueMap : any = {};
//       queueMeta.Items.forEach((q:any) => { queueMap[q.UUID ] = q; });

//       // Then inside grouping finalization
//       const summary = agentSummaryMap[g.agentArn];
//       const queue = queueMap[g.queueArn];

//       return {
//         Username: g.Username,
//         Names: g.Names,
//         agentArn: g.agentArn,
//         queueArn: g.queueArn,
//         "AVG Speed To Answer(sec)": new Date(avgSpeedToAnswer * 1000).toISOString().substr(11, 8),
//         Contact_Answered: g.answered,
//         "SL15 %": Number(((g.sla[15] / g.total) * 100).toFixed(2)),
//         "SL20 %": Number(((g.sla[20] / g.total) * 100).toFixed(2)),
//         "SL30 %": Number(((g.sla[30] / g.total) * 100).toFixed(2)),
//         "SL60 %": Number(((g.sla[60] / g.total) * 100).toFixed(2)),
//         "SL90 %": Number(((g.sla[90] / g.total) * 100).toFixed(2)),
//         "SL120 %": Number(((g.sla[120] / g.total) * 100).toFixed(2)),
//         "SL180 %": Number(((g.sla[180] / g.total) * 100).toFixed(2)),
//       };
//     });

//     // Search filter
//     if (searchText) {
//       processed = processed.filter((p: any) =>
//         p.Names && p.Names.toLowerCase().includes(String(searchText).toLowerCase())
//       );
//     }

//     // Sort by Names desc (like SQL)
//     processed.sort((a: any, b: any) => (b.Names || "").localeCompare(a.Names || ""));

//     // Pagination
//     const start = Number(currentPage) * Number(perPage);
//     const paginated = processed.slice(start, start + Number(perPage));

//     res.json([
//       paginated,
//       [{ count: processed.length }],
//       paginated
//     ]);
//   } catch (error) {
//     console.error("Error executing SQL query:", error);
//     res.status(500).json({ error: "Internal Server Error", details: error });
//   } finally {
//     console.log("Closing the database connection.");
//   }
// });

app.get("/api/getagentsla", verifyToken, async (req, res) => {
  const {
    currentPage = 1,
    perPage = 15,
    searchText = null,
    sval = null,
    fromdate = null,
    todate = null,
    queueid = null,
    type = null,
  } = req.query;

  try {
    // Parse filters
    const agents = sval ? String(sval).split(",").filter(v => v) : [];
    const queues = queueid ? String(queueid).split(",").filter(v => v) : [];

    // Load supporting tables
    const [agentSummary, queueMeta] = await Promise.all([
      dynamo.scan({ TableName: "TblmstAgentSummary" }).promise(),
      dynamo.scan({ TableName: "TblmstQueue" }).promise()
    ]);

    // Lookup maps
    const agentSummaryMap: any = {};
    agentSummary.Items.forEach((a: any) => { agentSummaryMap[a.UUID] = a; });

    const queueMap: any = {};
    queueMeta.Items.forEach((q: any) => { queueMap[q.UUID] = q; });

    // Contact data
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: "#event = :queued AND #time BETWEEN :from AND :to",
      ExpressionAttributeNames: {
        "#event": "eventType",
        "#time": "eventTime"
      },
      ExpressionAttributeValues: {
        ":queued": "QUEUED",
        ":from": fromdate,
        ":to": todate
      }
    };

    const result = await dynamo.scan(params).promise();
    let items = result.Items || [];

    // Apply filters like SQL temp tables
    if (agents.length > 0 && !agents.includes("1")) {
      items = items.filter((i: any) => agents.includes(i.agentArn));
    }
    if (queues.length > 0 && !queues.includes("1")) {
      items = items.filter((i: any) => queues.includes(i.queueInfo.queueArn.split('queue/')[1]));
    }

    // Grouping logic
    const grouped: any = {};
    items.forEach((item: any) => {
      let key;
      if (Number(type) === 1) key = item?.agentInfo?.agentArn.split('agent/')[1] || '';                      // Agent wise
      else if (Number(type) === 2) key = item?.queueInfo?.queueArn.split('queue/')[1] || '';                 // Queue wise
      else key = `${item?.agentInfo?.agentArn.split('agent/')[1]}_${item?.queueInfo?.queueArn.split('queue/')[1]}`;                   // Agent + Queue

      if (!grouped[key]) {
        grouped[key] = {
          Username: agentSummaryMap[item?.agentInfo?.agentArn.split('agent/')[1] || '']?.Username || null,
          Names: queueMap[item?.queueInfo?.queueArn.split('queue/')[1]]?.Names || null,
          agentArn: item?.agentInfo?.agentArn.split('agent/')[1] || '',
          queueArn: item?.queueInfo?.queueArn.split('queue/')[1] || '',
          total: 0,
          answered: 0,
          sumSpeedToAnswer: 0,
          sla: { 15: 0, 20: 0, 30: 0, 60: 0, 90: 0, 120: 0, 180: 0 }
        };
      }

      const g = grouped[key];
      g.total++;

      // timestamps
      const qStart = item?.queueInfo?.enqueueTimestamp ? new Date(item?.queueInfo?.enqueueTimestamp).getTime() : null;
      const disconnect = item?.disconnectTimeStamp ? new Date(item?.disconnectTimeStamp).getTime() : null;
      const connAgent = item?.agentInfo?.connectedToAgentTimestamp ? new Date(item?.agentInfo?.connectedToAgentTimestamp).getTime() : null;
      const connSystem = item.connectedToSystemTimestamp ? new Date(item.connectedToSystemTimestamp).getTime() : null;

      // Speed to Answer calculation
      let speedToAnswer = null;
      if (Number(type) === 1) {
        if (qStart && disconnect) {
          speedToAnswer = (disconnect - qStart) / 1000; // sec
        }
      } else {
        if (qStart && connAgent) {
          speedToAnswer = (connAgent - qStart) / 1000;
        }
      }
      if (speedToAnswer != null) g.sumSpeedToAnswer += speedToAnswer;

      if (connAgent) g.answered++;

      // SLA checks
      if (Number(type) === 1 && connSystem && disconnect) {
        const baseDiff = (disconnect - connSystem) / 1000;
        if (baseDiff >= 15) g.sla[15]++;
        if (baseDiff >= 20) g.sla[20]++;
        if (baseDiff >= 30) g.sla[30]++;
        if (baseDiff >= 60) g.sla[60]++;
        if (baseDiff >= 90) g.sla[90]++;
        if (baseDiff >= 120) g.sla[120]++;
        if (baseDiff >= 180) g.sla[180]++;
      }
      if (Number(type) !== 1 && qStart && connAgent) {
        const diff = (connAgent - qStart) / 1000;
        if (diff >= 15) g.sla[15]++;
        if (diff >= 20) g.sla[20]++;
        if (diff >= 30) g.sla[30]++;
        if (diff >= 60) g.sla[60]++;
        if (diff >= 90) g.sla[90]++;
        if (diff >= 120) g.sla[120]++;
        if (diff >= 180) g.sla[180]++;
      }
    });

    // Finalize rows
    let processed = Object.values(grouped).map((g: any) => {
      const avgSpeedToAnswer = g.total > 0 ? g.sumSpeedToAnswer / g.total : 0;

      return {
        id: g.queueArn,
        Username: g.Username,
        Names: g.Names,
        agentArn: g.agentArn,
        queueArn: g.queueArn,
        "AVG Speed To Answer(sec)": new Date(avgSpeedToAnswer * 1000).toISOString().substr(11, 8),
        Contact_Answered: g.answered,
        "SL15 %": Number(((g.sla[15] / g.total) * 100).toFixed(2)),
        "SL20 %": Number(((g.sla[20] / g.total) * 100).toFixed(2)),
        "SL30 %": Number(((g.sla[30] / g.total) * 100).toFixed(2)),
        "SL60 %": Number(((g.sla[60] / g.total) * 100).toFixed(2)),
        "SL90 %": Number(((g.sla[90] / g.total) * 100).toFixed(2)),
        "SL120 %": Number(((g.sla[120] / g.total) * 100).toFixed(2)),
        "SL180 %": Number(((g.sla[180] / g.total) * 100).toFixed(2)),
      };
    });

    // Search filter
    if (searchText) {
      processed = processed.filter((p: any) =>
        p.Names && p.Names.toLowerCase().includes(String(searchText).toLowerCase())
      );
    }

    // Sort (SQL: order by Names desc)
    processed.sort((a: any, b: any) => (b.Names || "").localeCompare(a.Names || ""));

    // Pagination
    const start = Number(currentPage) * Number(perPage);
    const paginated = processed.slice(start, start + Number(perPage));

    res.json([
      paginated,
      [{ count: processed.length }],
      paginated
    ]);

  } catch (error) {
    console.error("Error executing getagentsla:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  }
});
app.get("/api/deletethreshold", verifyToken, async (req, res) => {
  const { id = "" } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(
    //     `Exec [uspDeleteThreshold] ${id !== null ? "'" + id + "'" : "NULL"}`
    //   );
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);


    const result = await dynamo.scan({
      TableName: "tblAgentNotification",
      FilterExpression: "#u = :id",
      ExpressionAttributeNames: { "#u": "id" },
      ExpressionAttributeValues: { ":id": id }
    }).promise();

    // 2. Delete each item by id
    for (const item of result.Items) {
      await dynamo.delete({
        TableName: "tblAgentNotification",
        Key: { id: item.id }
      }).promise();
    }

    const data = await dynamo.delete({
      TableName: "tblmst_thresholdreport",
      Key: { id: Number(id) }
    }).promise();
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});

// app.get("/api/notify", verifyToken, async (req, res) => {
//   const { agentid = "" } = req.query;
//   try {
//     const pool = await poolPromise;
//     console.log("Connected to the database.");
//     const result = await pool
//       .request()
//       .query(
//         `Exec [uspNotificationAlert] ${agentid !== null ? "'" + agentid + "'" : "NULL"
//         }`
//       );
//     console.log("SQL query executed successfully.");
//     res.json(result.recordsets);
//   } catch (error) {
//     console.error("Error executing SQL query:", error);
//     res.status(500).json({ error: "Internal Server Error", details: error });
//   } finally {
//     console.log("Closing the database connection.");
//   }
// });


app.get("/api/notify", async (req, res) => {
  const { agentid = "" } = req.query;

  try {
    if (!agentid) {
      return res.status(400).json({ error: "Missing agentid" });
    }

    const currentDateTime = new Date();
    const today = currentDateTime.toLocaleString("en-US", { weekday: "long" });

    // 1. Get agent notifications
    // const notifResp = await dynamo.query({
    //   TableName: "tblAgentNotification",
    //   KeyConditionExpression: "agentid = :agentid",
    //   ExpressionAttributeValues: { ":agentid": agentid }
    // }).promise();
    // 1. Get agent notifications
    const notifResp = await dynamo.scan({
      TableName: "tblAgentNotification",
      FilterExpression: "agentId = :agentId",
      ExpressionAttributeValues: { ":agentId": agentid }
    }).promise();


    const alerts = [];

    for (const notif of notifResp.Items) {
      // Fetch threshold rule
      const ruleResp = await dynamo.get({
        TableName: "tblmst_thresholdreport",
        Key: { id: notif.id }
      }).promise();

      if (!ruleResp.Item) continue;
      const rule = ruleResp.Item;

      // Check active window
      const actDate = new Date(rule.ruleActivationDate);
      const deactDate = rule.ruleDeactivationDate ? new Date(rule.ruleDeactivationDate) : null;
      if (actDate > currentDateTime) continue;
      if (deactDate && deactDate < currentDateTime) continue;

      // Check weekday
      if (!rule.DayofWeek.includes(today)) continue;

      // Frequency check
      const lastExecuted = notif.LastExecuted ? new Date(notif.LastExecuted) : null;
      let canRun = false;
      if (rule.frequencyOfAlerts === "Hourly") {
        canRun = !lastExecuted || ((currentDateTime.getTime() - lastExecuted.getTime()) / (1000 * 60 * 60)) >= 1;
      } else if (rule.frequencyOfAlerts === "Daily") {
        canRun = !lastExecuted || ((currentDateTime.getTime() - lastExecuted.getTime()) / (1000 * 60 * 60 * 24)) >= 1;
      } else if (rule.frequencyOfAlerts === "Once") {
        canRun = !lastExecuted;
      }
      if (!canRun) continue;

      // -------- RuleType Logic --------
      const queueData = await dynamo.get({
        TableName: "tmst_currentagentcalldata",
        Key: { QueueId: rule.Queue }
      }).promise();

      if (!queueData.Item) continue;

      if (rule.RuleType === "No Agent Staffed") {
        if (parseInt(queueData.Item.AGENTS_AVAILABLE, 10) === 0) {
          alerts.push({
            RuleType: "No Agent Staffed",
            QueueName: rule.Queue,
            Value: queueData.Item.AGENTS_AVAILABLE,
            msg: rule.notificationMessage,
            threshold: rule.staffingLevelStart,
            frequency: rule.frequencyOfAlerts,
            email: rule.recipientsEmailList,
            notificationmethod: rule.notificationmethod
          });
        }
      }
      if (rule.RuleType === "Low Agent Staffed") {
        if (
          parseInt(queueData.Item.CONTACTS_IN_QUEUE, 10) <= rule.staffingLevelStart &&
          parseInt(queueData.Item.AGENTS_AVAILABLE, 10) > 0
        ) {
          alerts.push({
            RuleType: "Low Agent Staffed",
            QueueName: rule.Queue,
            Value: queueData.Item.AGENTS_AVAILABLE,
            msg: rule.notificationMessage,
            threshold: rule.staffingLevelStart,
            frequency: rule.frequencyOfAlerts,
            email: rule.recipientsEmailList,
            notificationmethod: rule.notificationmethod
          });
        }
      }
      if (rule.RuleType === "Call in Queue") {
        if (parseInt(queueData.Item.CONTACTS_IN_QUEUE, 10) >= rule.staffingLevelStart) {
          alerts.push({
            RuleType: "Call in Queue",
            QueueName: rule.Queue,
            Value: queueData.Item.CONTACTS_IN_QUEUE,
            msg: rule.notificationMessage,
            threshold: rule.staffingLevelStart,
            frequency: rule.frequencyOfAlerts,
            email: rule.recipientsEmailList,
            notificationmethod: rule.notificationmethod
          });
        }
      }
      if (rule.RuleType === "Agent Availability") {
        // Example: compute % availability (mock, since depends on tbmst_Agentsummary schema)
        const percentAvailable = (parseInt(queueData.Item.AGENTS_AVAILABLE, 10) / queueData.Item.TotalAgents) * 100;
        if (percentAvailable <= rule.staffingLevelStart) {
          alerts.push({
            RuleType: "Agent Availability",
            QueueName: rule.Queue,
            Value: percentAvailable,
            msg: rule.notificationMessage,
            threshold: rule.staffingLevelStart,
            frequency: rule.frequencyOfAlerts,
            email: rule.recipientsEmailList,
            notificationmethod: rule.notificationmethod
          });
        }
      }
      if (rule.RuleType === "Queue Answer Rate") {
        // Placeholder: always return fixed value like SQL stub did
        alerts.push({
          RuleType: "Queue Answer Rate",
          QueueName: "AnswerRate SLA",
          Value: "20%",
          msg: rule.notificationMessage,
          threshold: rule.staffingLevelStart,
          frequency: rule.frequencyOfAlerts,
          email: rule.recipientsEmailList,
          notificationmethod: rule.notificationmethod
        });
      }
      if (rule.RuleType === "Queue Abandon Rate") {
        // Example: compute abandon % = abandoned / (handled + abandoned)
        const handled = parseInt(queueData.Item.CONTACTS_HANDLED, 10);
        const abandoned = parseInt(queueData.Item.CONTACTS_ABANDONED, 10);
        const rate = (abandoned / (handled + abandoned)) * 100;
        if (rate >= rule.staffingLevelStart) {
          alerts.push({
            RuleType: "Queue Abandon Rate",
            QueueName: rule.Queue,
            Value: rate.toFixed(2),
            msg: rule.notificationMessage,
            threshold: rule.staffingLevelStart,
            frequency: rule.frequencyOfAlerts,
            email: rule.recipientsEmailList,
            notificationmethod: rule.notificationmethod
          });
        }
      }
      if (rule.RuleType === "Queue Wise SLA") {
        // Placeholder: depends on tbltrn_Contact_data aggregation
        alerts.push({
          RuleType: "Queue Wise SLA",
          QueueName: rule.Queue,
          Value: "85.00", // compute SLA% from contact_data table
          msg: rule.notificationMessage,
          threshold: rule.staffingLevelStart,
          frequency: rule.frequencyOfAlerts,
          email: rule.recipientsEmailList,
          notificationmethod: rule.notificationmethod
        });
      }
      // update LastExecuted if any alert fired
      if (alerts.length > 0) {
        await dynamo.update({
          TableName: "tblAgentNotification",
          Key: { id: notif.id, agentid },
          UpdateExpression: "set LastExecuted = :dt",
          ExpressionAttributeValues: { ":dt": currentDateTime.toISOString() }
        }).promise();
      }
    }
    res.json([alerts]);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Notify API executed for agentid:", agentid);
  }
});


// app.post('/api/sendmail', verifyToken, async (req, res) => {
//   const val = req.body;
//   try {
//     let transporter = nodemailer.createTransport({
//       host: 'smtpout.secureserver.net', // GoDaddy SMTP server
//       port: 465, // Secure port for SSL
//       secure: true, // Use SSL
//       auth: {
//         user: 'support@arviussoft.com', // Your GoDaddy email
//         pass: 'India@123' // Your GoDaddy email password
//       }
//     });

//     // Array of email addresses
//     const emailArray = val.emailArray;

//     // Loop through the array and send emails
//     emailArray.forEach((email) => {
//       let mailOptions = {
//         from: 'support@arviussoft.com', // Your GoDaddy email
//         to: email,
//         subject: val.subject,
//         text: val.text,
//       };

//       // Send the email
//       transporter.sendMail(mailOptions, (error, info) => {
//         if (error) {
//           res.status(200).json({ Error: error, details: info.response });
//         } else {
//           res.status(200).json({ Email: val?.emailArray, details: info.response });
//         }
//       });
//     });

//   } catch (error) {
//     console.error('Error executing SQL query:', error);
//     res.status(500).json({ error: 'Internal Server Error', details: error });
//   } finally {
//     console.log('Closing the database connection.');

//   }
// });

app.get("/api/getuserauditreport", verifyToken, async (req, res) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
    fromdate = null,
    todate = null,
  } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(
    //     `Exec [usp_UserAuditReport] ${currentPage},${perPage},${searchText !== null ? "'" + searchText + "'" : "NULL"
    //     },${sval !== null ? "'" + sval + "'" : "NULL"},${fromdate !== null ? "'" + fromdate + "'" : "NULL"
    //     },${todate !== null ? "'" + todate + "'" : "NULL"}`
    //   );
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);


    const params = {
      TableName: 'tbltrnAuditReport',
      FilterExpression: '#date BETWEEN :from AND :to',
      ExpressionAttributeNames: { '#date': 'inserteddate' },
      ExpressionAttributeValues: {
        ':from': fromdate,
        ':to': todate
      }
    }

    // Step 1: Scan AuditReport table
    const auditData = await dynamo.scan(params).promise();

    // Step 2: Group by userloginid
    const grouped = new Map<string, { login: string; logout: string }>();
    auditData.Items?.forEach((item: any) => {
      const id = item.userloginid;
      const date = item.inserteddate;
      if (!grouped.has(id)) {
        grouped.set(id, { login: date, logout: date });
      } else {
        const current = grouped.get(id)!;
        current.login = date < current.login ? date : current.login;
        current.logout = date > current.logout ? date : current.logout;
      }
    });

    // Step 3: Fetch user details and type
    const results = [];
    for (const [userloginid, { login, logout }] of grouped.entries()) {
      const userRes = await dynamo.get({
        TableName: 'tblmst_user',
        Key: { userloginid }
      }).promise();

      const user = userRes.Item;
      if (!user) continue;

      const typeRes = await dynamo.get({
        TableName: 'tbl_UserType',
        Key: { id: Number(user.usertype) }
      }).promise();

      const userType = typeRes.Item?.usertype || '';

      // Optional search filter
      if (
        searchText &&
        // !userloginid.includes(searchText) &&
        !user.username.includes(searchText) &&
        !userType.includes(searchText)
      ) continue;

      results.push({
        id: userloginid,
        userloginid,
        username: user.username,
        useremail: user.useremail,
        UserType: userType,
        login,
        logout: login === logout ? null : logout
      });
    }

    // Step 4: Sort and paginate
    const sorted = results.sort((a, b) => new Date(b.login).getTime() - new Date(a.login).getTime());
    //const paginated = sorted.slice((pageNo - 1) * rowCountPerPage, pageNo * rowCountPerPage);
    const paginated = sorted;

    res.status(200).json([
      paginated,
      [{ count: sorted.length }],
      paginated

    ]);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
const getMaxLoginId = async () => {
  let maxId = 0;
  let lastEvaluatedKey = null;

  do {
    let result: any = await dynamo.scan({
      TableName: "tbltrnAuditReport",
      ProjectionExpression: "id", // only fetch this field
      ExclusiveStartKey: lastEvaluatedKey
    }).promise();

    // Find local max in this page
    result.Items.forEach((item: any) => {
      const id = Number(item.id);  // ensure numeric
      if (id > maxId) maxId = id;
    });

    // Continue scanning if paginated
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return maxId;
};
function formatDateTime(date: any) {
  let pad = (n: any, z = 2) => ('00' + n).slice(-z);

  return date.getFullYear() + '-' +
    pad(date.getMonth() + 1) + '-' +
    pad(date.getDate()) + 'T' +
    pad(date.getHours()) + ':' +
    pad(date.getMinutes()) + ':' +
    pad(date.getSeconds()) + '.' +
    pad(date.getMilliseconds(), 3) + '0000';  // extend to 7 digits
}

// insert  audit report modal data
app.post("/api/addauditreport", verifyToken, async (req, res) => {
  let customdata = req.body;

  // const pool = await poolPromise;
  // const table = new sql.Table();
  // table.columns.add("userloginid", sql.NVarChar(255));
  // table.columns.add("Username", sql.NVarChar(255));
  // table.columns.add("UserEmail", sql.NVarChar(255));
  // table.columns.add("UserType ", sql.NVarChar(255));
  // table.columns.add("Activity ", sql.NVarChar(255));

  // table.rows.add(
  //   customdata.userloginid,
  //   customdata.userName,
  //   customdata.userEmail,
  //   customdata.userType,
  //   customdata.activity
  // );
  // customdata.forEach(row => {
  //   table.rows.add(row.UserEmail, row.Username, row.UserType, row.isactive);
  // });
  try {
    // const pool = await poolPromise;
    // const request = pool.request();
    // request.input("TT_auditreport", table);
    // const result = await request.execute("usp_insertuserauditreport");
    // console.log("Data inserted successfully:", result);
    // res
    //   .status(201)
    //   .json({ message: "Audit added successfully", data: result.recordset });


    const maxUserLoginId = await getMaxLoginId();
    const id = maxUserLoginId + 1;

    const user = await dynamo
      .put({
        TableName: "tbltrnAuditReport",
        Item: {
          id: id,
          userloginid: customdata.userloginid,
          username: customdata.userName,
          usertype: customdata.userType,
          useremail: customdata.userEmail,
          activity: customdata.activity,
          inserteddate: formatDateTime(new Date()),
        },
      })
      .promise();
    res.json({ Data: "Data inserted successfully" });
  } catch (error) {
    console.error("Error inside getdbdata.addauditreport:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");

  }
});

// app.post("/api/addauditreport", verifyToken, async (req, res) => {
//   let customdata = req.body;
//   const pool = await poolPromise;

//   try {
//     // Define table structure
//     const table = new sql.Table("TT_auditreport"); // ✅ Ensure table name is passed
//     table.create = true; // ✅ Allow table creation if not exists
//     table.columns.add("userloginid", sql.NVarChar(255));
//     table.columns.add("Username", sql.NVarChar(255));
//     table.columns.add("UserEmail", sql.NVarChar(255));
//     table.columns.add("UserType", sql.NVarChar(255)); // ✅ Remove extra space in column names
//     table.columns.add("Activity", sql.NVarChar(255));

//     // Add data to table
//     table.rows.add(
//       customdata.userloginid,
//       customdata.userName,
//       customdata.userEmail,
//       customdata.userType,
//       customdata.activity
//     );

//     // Create request
//     const request = pool.request();
//     request.input("TT_auditreport", table); // ✅ Ensure stored procedure accepts TVP

//     // Execute stored procedure and await the result
//     const result = await request.execute("usp_insertuserauditreport");

//     console.log("Data inserted successfully:", result);
//     res
//       .status(201)
//       .json({
//         message: "Audit report inserted successfully",
//         data: result.recordset,
//       });
//   } catch (error) {
//     console.error("Error inside getdbdata.addauditreport:", error);
//     res.status(500).json({ error: "Internal Server Error", details: error });
//   } finally {
//     // ✅ Close DB connection safely
//     console.log("Closing the database connection.");
//   }
// });

app.get("/api/getedituser", verifyToken, async (req, res) => {
  const { userid = "" } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(`Exec uspEdituser  ${"'" + userid + "'"}`);
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);

    const edituser = dynamo.query({
      TableName: "tblmst_user",
      KeyConditionExpression: "userloginid = :uid",
      ExpressionAttributeValues: {
        ":uid": userid
      }
    }).promise();


    // const edituser = dynamo.scan({
    //   TableName: "tblmst_user",
    //   FilterExpression: "userloginid = :uid",
    //   ExpressionAttributeValues: { ":uid": userid }
    // }).promise();

    const result = await edituser;
    if (!result.Items || result.Items.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const mergedData: any = {};
    result.Items.forEach((item: any) => {
      const contactId = item.userloginid;
      if (!mergedData[contactId]) {
        mergedData[contactId] = {
          userloginid: contactId,
          username: null,
          useremail: null,
          usertype: null,
          active: null,
          usertypeval: null
        };
      }
      if (item.username) mergedData[contactId].username = item.username;
      if (item.useremail) mergedData[contactId].useremail = item.useremail;
      if (item.usertype) mergedData[contactId].usertype = item.usertype;
      if (item.usertype) mergedData[contactId].usertypeval = item.usertype;
      if (item.active) mergedData[contactId].active = item.active;
    });

    const userTypeUUIDs = new Set<string>();
    Object.values(mergedData).forEach((item: any) => {
      if (item.usertype) userTypeUUIDs.add(item.usertype);
    });
    let userTypes: Record<string, any> = {};
    if (userTypeUUIDs.size > 0) {
      const userTypeParams = {
        RequestItems: {
          tbl_UserType: {
            Keys: Array.from(userTypeUUIDs).map((uuid) => ({ id: Number(uuid) }))
          }
        }
      };
      const userTypeData = await dynamo.batchGet(userTypeParams).promise();
      userTypeData.Responses?.tbl_UserType?.forEach((q: any) => {
        userTypes[q.id] = { Names: q.usertype };
      });
    }
    // Merge results back
    Object.values(mergedData).forEach((item: any) => {
      if (item.usertype && userTypes[item.usertype]) {
        item.usertype = userTypes[item.usertype].Names;
      }
    });
    let result1 = Object.values(mergedData);
    res.json([result1]);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});

app.post("/api/updatemanageuser", verifyToken, async (req, res) => {
  const customdata = req.body;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(
    //     `Exec [uspUpdateManageuser]  ${"'" + customdata.userloginid + "'"},${"'" + customdata.username + "'"
    //     },${"'" + customdata.useremail + "'"},${"'" + customdata.usertype + "'"
    //     },${"'" + customdata.isactive + "'"}`
    //   );
    // console.log("SQL query executed successfully.");
    // res.json({ Data: "Inserdata" });

    const user = await dynamo.update({
      TableName: "tblmst_user",
      Key: { userloginid: customdata.userloginid },
      UpdateExpression: "set username = :un, useremail = :em, usertype = :ut, active = :ur",
      ExpressionAttributeValues: {
        ":un": customdata.username,
        ":em": customdata.useremail,
        ":ut": customdata.usertype,
        ":ur": JSON.stringify(customdata.isactive)
      },
      ReturnValues: "UPDATED_NEW"
    }).promise();
    res.json({ Data: "Inserdata" });

    // res.json(result.recordset);
  } catch (error) {
    console.error("Error inside getdbdata.getrouteprofile:", error);
    // res.status(500).json({ error: 'Internal Server Error', details: error });
  } finally {
    console.log("Closing the database connection.");
    //
  }
});

app.get("/api/deleteuser", verifyToken, async (req, res) => {
  const { userid = "" } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(`Exec uspDeleteUser  ${"'" + userid + "'"}`);
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);

    const user = await dynamo.delete({
      TableName: "tblmst_user",
      Key: { userloginid: userid }
    }).promise();
    res.json({ Data: "Deletedata" });
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
//    get supervisor
app.get("/api/callqueuesuper", verifyToken, async (req, res) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
    fromdate = null,
    todate = null,
    queueid = null,
  } = req.query;
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool
      .request()
      .query(
        `Exec uspGetCallQueue_Svr ${fromdate !== null ? "'" + fromdate + "'" : "NULL"
        },${todate !== null ? "'" + todate + "'" : "NULL"}`
      );
    console.log("SQL query executed successfully.");

    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});


app.get("/api/callagentsuper", verifyToken, async (req, res) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
    fromdate = null,
    todate = null,
    queueid = null,
  } = req.query;
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool
      .request()
      .query(
        `Exec uspGetCallAgent_Svr ${fromdate !== null ? "'" + fromdate + "'" : "NULL"
        },${todate !== null ? "'" + todate + "'" : "NULL"}`
      );
    console.log("SQL query executed successfully.");

    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});


// helper to format seconds → HH:mm:ss
function secondsToHMS(seconds: any) {
  const date = new Date(0);
  date.setSeconds(seconds || 0);
  return date.toISOString().substr(11, 8); // HH:mm:ss
}
app.get("/api/getdashsvr", async (req, res) => {
  const { queueid = "" } = req.query;
  const queueIds = String(queueid) ? String(queueid).split(",") : [];

  try {
    const today = new Date().toISOString().split("T")[0];
    // ---- 1) Get agent summary ----
    const agentParams = { TableName: "TbltrnCurrentAgentCalldataCount" };
    const agentData = await dynamo.scan(agentParams).promise();
    let AvailableAgent = 0,
      CallinQueue = 0,
      AgentOnCall = 0,
      AgentOnAux = 0;

    agentData.Items.forEach((item: any) => {
      AvailableAgent += parseInt(item.AGENTS_AVAILABLE || 0);
      CallinQueue += parseInt(item.CONTACTS_IN_QUEUE || 0);
      AgentOnCall += parseInt(item.AGENTS_ON_CALL || 0);
      AgentOnAux += parseInt(item.AGENTS_NON_PRODUCTIVE || 0);
    });

    // ---- 2) Get metrics ----
    const metricParams = {
      TableName: "TbltrnHistoricalQueue",
      FilterExpression: "begins_with(StartTime, :today)",
      ExpressionAttributeValues: { ":today": today },
    };
    const metricData = await dynamo.scan(metricParams).promise();

    const metrics = metricData.Items.filter((m: any) =>
      queueIds.length === 0 || queueIds.includes(String(m.queue_id))
    );

    // ---- 3) Aggregate ----
    let sumHandled = 0,
      sumNonResponse = 0,
      sumIdleTime = 0,
      sumContactTime = 0,
      sumNonProdTime = 0,
      sumOccWeighted = 0,
      sumContactsCreated = 0,
      sumOnlineTime = 0,
      sumAfterContactWorkTime = 0,
      sumInteractionTime = 0,
      sumHoldTime = 0,
      sumHandleTime = 0,
      contactsPutOnHold = 0,
      contactsAbandoned = 0,
      startTime: string | number | Date | null = null,
      endTime: string | number | Date | null = null;

    metrics.forEach((m: any) => {
      const handled = parseFloat(m.CONTACTS_HANDLED || 0);
      const nonResp = parseFloat(m.Agent_non_response || 0);
      const occ = parseFloat(m.AGENT_OCCUPANCY || 0);
      const contactsCreated = parseFloat(m.CONTACTS_CREATED || 0);

      sumHandled += handled;
      sumNonResponse += nonResp;
      sumIdleTime += parseFloat(m.sum_idle_time_agent || 0);
      sumContactTime += parseFloat(m.sum_contact_time_agent || 0);
      sumNonProdTime += parseFloat(m.SUM_NON_PRODUCTIVE_TIME_AGENT || 0);
      sumOccWeighted += occ * contactsCreated;
      sumContactsCreated += contactsCreated;
      sumOnlineTime += parseFloat(m.sum_online_time_AGENT || 0);
      sumAfterContactWorkTime += parseFloat(m.AVG_AFTER_CONTACT_WORK_TIME || 0) * handled;
      sumInteractionTime += parseFloat(m.AVG_INTERACTION_TIME || 0) * handled;
      sumHoldTime += parseFloat(m.AVG_HOLD_TIME || 0);
      sumHandleTime += parseFloat(m.AVG_HANDLE_TIME || 0) * handled;
      contactsPutOnHold += parseFloat(m.CONTACTS_PUT_ON_HOLD || 0);
      contactsAbandoned += parseFloat(m.CONTACTS_ABANDONED || 0);

      if (!startTime || new Date(m.StartTime) < new Date(startTime)) startTime = m.StartTime;
      if (!endTime || new Date(m.EndTime) > new Date(endTime)) endTime = m.EndTime;
    });

    // ---- 4) Derived metrics ----
    const agentAnswerRate =
      sumHandled + sumNonResponse === 0
        ? 0
        : (sumHandled / (sumHandled + sumNonResponse)) * 100;

    const agentOccupancy = sumHandled === 0 ? 0 : sumOccWeighted / sumHandled;
    const result1 = [{
      AvailableAgent,
      CallinQueue,
      AgentOnCall,
      AgentOnAux,
    }];
    const result = [{
      AGENT_ANSWER_RATE: agentAnswerRate.toFixed(2),
      sum_idle_time_agent: secondsToHMS(sumIdleTime),
      Agent_non_response: sumNonResponse,
      sum_contact_time_agent: secondsToHMS(sumContactTime),
      SUM_NON_PRODUCTIVE_TIME_AGENT: secondsToHMS(sumNonProdTime),
      AGENT_OCCUPANCY: agentOccupancy.toFixed(2),
      sum_online_time_AGENT: secondsToHMS(sumOnlineTime),
      AVG_AFTER_CONTACT_WORK_TIME: secondsToHMS(sumHandled === 0 ? 0 : sumAfterContactWorkTime / sumHandled),
      AVG_INTERACTION_TIME: secondsToHMS(sumHandled === 0 ? 0 : sumInteractionTime / sumHandled),
      AVG_HOLD_TIME: secondsToHMS(sumHoldTime / (metrics.length || 1)),
      AVG_HANDLE_TIME: secondsToHMS(sumHandled === 0 ? 0 : sumHandleTime / sumHandled),
      CONTACTS_HANDLED: sumHandled,
      CONTACTS_ABANDONED: contactsAbandoned,
      CONTACTS_PUT_ON_HOLD: contactsPutOnHold,
      CONTACTS_CREATED: sumContactsCreated,
      StartTime: startTime,
      EndTime: endTime,
    }];
    const data = [result1, result];
    res.json(data);
  } catch (error) {
    console.error("Error executing DynamoDB query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Finished processing /api/getdashsvr request.");
  }
});
app.get("/api/calloverview", async (req, res) => {
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool.request().query(`Exec uspGetCalloverview`);
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);

    const today = new Date().toISOString().split("T")[0];
    //const today = '2025-09-18'; 

    // ---- 1) Load agents lookup ----
    const agentsRes = await dynamo.scan({ TableName: "TblmstAgentSummary" }).promise();
    const agentMap: any = {};
    agentsRes.Items.forEach((a: any) => (agentMap[a.UUID] = a.Username));

    // ---- 2) Load today’s contact data ----
    const contactParams = {
      TableName: TABLE_NAME,
      FilterExpression: "begins_with(#t, :today)",
      ExpressionAttributeNames: { "#t": "eventTime" },
      ExpressionAttributeValues: { ":today": today },
    };
    const contactData = await dynamo.scan(contactParams).promise();
    const contacts = contactData.Items;
    // ---- 3) Hourly Overview ----
    const hourlyAgg: any = {};
    contacts.forEach((c: any) => {
      const t = new Date(c.eventTime);
      let hh: any = t.getUTCHours(); // UTC hour
      hh = hh < 10 ? `0${hh}` : `${hh}`;
      const key = `${hh}:00`;
      if (!hourlyAgg[key]) hourlyAgg[key] = { voice: 0, chat: 0 };
      if (c.channel === "VOICE") hourlyAgg[key].voice++;
      if (c.channel === "CHAT") hourlyAgg[key].chat++;
    });
    const hourlyOverview = Object.keys(hourlyAgg)
      .sort() // ensure chronological order
      .map(time => ({
        time,
        voice: hourlyAgg[time].voice,
        chat: hourlyAgg[time].chat,
      }));
    // ---- 4) Top 5 Agents ----
    const agentAgg: any = {};
    contacts.forEach((c: any) => {
      if (!c?.agentInfo?.agentArn) return;
      const username = agentMap[c?.agentInfo?.agentArn.split('agent/')[1]] || "Unknown";
      if (!agentAgg[username]) agentAgg[username] = { voice: 0, chat: 0 };
      if (c.channel === "VOICE") agentAgg[username].voice++;
      if (c.channel === "CHAT") agentAgg[username].chat++;
    });
    const topAgents = Object.keys(agentAgg)
      .map(username => ({
        Username: username,
        voice: agentAgg[username].voice,
        chat: agentAgg[username].chat,
      }))
      .sort((a, b) => {
        // sort like SQL: first by voice ASC, then by chat DESC
        if (a.voice === b.voice) return b.chat - a.chat;
        return a.voice - b.voice;
      })
      .slice(0, 5);

    // ---- 5) Return array of two arrays ----
    res.json([hourlyOverview, topAgents]);
  } catch (error) {
    console.error("Error in getcalloverview:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  }
});


// //Get widgets drop down details
app.get('/api/getwidgetdropddn', verifyToken, async (req, res) => {
  const { userid = '' } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    // .request()
    // .query(`Exec uspGetWidgetDropDown ${"'" + userid + "'"}`);
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);
    const dashboardParams = { TableName: 'tbltrnDashboardWidgetData' };
    const dashboardData = await dynamo.scan(dashboardParams).promise();
    const widgetsParams = { TableName: 'tblmstDashWidget' };
    const widgetsData = await dynamo.scan(widgetsParams).promise();
    const filtered = userid
      ? dashboardData.Items?.filter((item: any) =>
        item.userid === userid ||
        item.UserId === userid ||
        item.userId === userid
      )
      : dashboardData.Items;

    // ✅ Proper type for grouped
    const grouped: Record<string, { label: string; value: string }[]> = {};
    filtered?.forEach((item: any) => {
      const widgetIds = (item.WidgetId || item.widgetid || '').split(',');
      const groupKey = item.group || item.Group || '0';
      if (!grouped[groupKey]) grouped[groupKey] = [];
      widgetIds.forEach((wid: string) => {
        const widget = widgetsData.Items?.find(
          (w: any) =>
            w.WidgetId === wid.trim() ||
            w.widgetid === wid.trim() ||
            w.widgetId === wid.trim()
        );
        if (widget) {
          grouped[groupKey].push({
            label: widget.widgetname || widget.WidgetName || widget.widgetName || '',
            value: wid.trim()
          });
        }
      });
    });
    const result = Object.values(grouped);
    const count = filtered?.length || 0;
    res.json(
      result,
    );
  } catch (error: any) {
    console.error('DynamoDB Error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

app.get("/api/getdashwidgets", async (req, res) => {
  const { userid = null } = req.query;
  try {
    //     const pool = await poolPromise;
    //     console.log("Connected to the database.");
    //     const result = await pool
    //       .request()
    //       .query(`Exec uspGetDashboardWidgets ${"'" + userid + "'"}`);
    //     console.log("SQL query executed successfully.");
    const temp1 = await dynamo.get({
      TableName: "tbltrnDashboardWidgetData",
      Key: { UserId: String(userid) }
    }).promise();

    const params1: any = {
      TableName: 'tblmstDashWidget',
    };
    const temp2 = await dynamo.scan(params1).promise();
    const allowedIds = new Set();
    temp1.Item.WidgetId.split(",").forEach((id: any) => allowedIds.add(id.trim()));
    // Step 2: Transform json2 using allowed IDs
    const output1 = temp2.Items
      .filter((widget: any) => allowedIds.has(widget.WidgetId))
      .map((widget: any) => ({
        name: widget.WidgetName,
        id: widget.WidgetId,
        path: widget.ImgPath,
        status: widget.IsActive === "1" ? "A" : "I"
      }));

    const output2 = temp2.Items.map((widget: any) => ({
      name: widget.WidgetName,
      id: widget.WidgetId,
      path: widget.ImgPath,
      status: allowedIds.has(widget.WidgetId)
        ? (widget.IsActive === "1" ? "A" : "I")
        : "L",   // 👈 only status becomes null
      widgetheader: widget.WidgetHeader
    }));
    const temp3 = await dynamo.get({
      TableName: "tblUserLayouts",
      Key: { UserId: Number(userid) }
    }).promise();


    var rd = [
      output1,
      output2,
      [{ "layout": temp3.Item.layout }]
    ];

    console.log("SQL query executed successfully.");
    res.json(rd);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
app.post("/api/insertwidgetdashboard", verifyToken, async (req, res) => {
  let customdata = req.body;
  // const pool = await poolPromise;
  // const table = new sql.Table();
  // table.columns.add("UserId", sql.NVarChar(200));
  // table.columns.add("DashBoardName", sql.NVarChar(200));
  // table.columns.add("WidgetId", sql.NVarChar(500));
  // table.rows.add(
  //   customdata.UserId,
  //   customdata.DashBoardName,
  //   customdata.WidgetId
  // );
  try {
    // const pool = await poolPromise;
    // const request = pool.request();
    // request.input("TTtbltrnDashboardWidgetData", table);
    // const result = await request.execute("uspInsertWidgetDashboard");
    // console.log("Data inserted successfully:", result);
    // res.status(201).json({message: "insertwidgetdashboard added successfully", data: result.recordset,});
    const params = {
      TableName: "tbltrnDashboardWidgetData", // DynamoDB table name
      Key: { UserId: customdata.UserId },
      UpdateExpression: "SET DashBoardName = :d, WidgetId = :w",
      ExpressionAttributeValues: {
        ":d": customdata.DashBoardName,
        ":w": customdata.WidgetId,
      },
      ReturnValues: "ALL_NEW", // returns the inserted/updated item
    };

    const result = await dynamo.update(params).promise();

    console.log("Data upserted successfully:", result);

    res.status(201).json({
      message: "insertwidgetdashboard added/updated successfully",
      data: result.Attributes,
    });
  } catch (error) {
    console.error("Error inside getdbdata.getrouteprofile:", error);
  } finally {
    console.log("Closing the database connection.");
  }
});
// Get all widgets from master table into a map
async function getWidgetsMap(): Promise<Record<string, string>> {
  const params = {
    TableName: "tblmstDashWidget", // your tblmstDashWidget equivalent
  };

  const result = await dynamo.scan(params).promise();
  const map: Record<string, string> = {};

  (result.Items || []).forEach((item: any) => {
    map[item.WidgetId] = item.WidgetName;
  });

  return map;
}
//This is to get the dashboard widgets
app.get("/api/getdashaccess", verifyToken, async (req, res) => {
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool.request().query(`Exec UspGetDashboardAccess`);
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);
    // Step 1: Load widget master map
    const widgetsMap = await getWidgetsMap();

    // Step 2: Load users
    const usersResult = await dynamo.scan({ TableName: "tblmst_user" }).promise();
    const userMap: Record<string, string> = {};
    (usersResult.Items || []).forEach((item: any) => {
      userMap[item.userloginid] = item.username;
    });

    // Step 3: Load dashboard widget data
    const dashResult = await dynamo
      .scan({ TableName: "tbltrnDashboardWidgetData" })
      .promise();

    // Step 4: Transform data like SQL join
    const output: any[] = [];
    (dashResult.Items || []).forEach((item: any) => {
      const widgetIds = (item.WidgetId || "").split(",").filter(Boolean);
      const widgetNames = widgetIds
        .map((id: any) => widgetsMap[id])
        .filter(Boolean)
        .join(", ");

      output.push({
        id: item.UserId,
        userloginid: item.UserId,
        username: userMap[item.UserId] || null,
        dashboardname: item.DashBoardName,
        WidgetNames: widgetNames,
        createddate: item.CreatedDate,
      });
    });
    res.json([output, [{ count: output.length }], output]);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
//This is to get the userlist
app.get("/api/getuserlist", verifyToken, async (req, res) => {
  const { userid = null } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool.request().query(`Exec uspGetuserlist`);
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);
    // Step 1: Get all UserIds from tbltrnDashboardWidgetData
    const widgetData = await dynamo
      .scan({
        TableName: "tbltrnDashboardWidgetData",
        ProjectionExpression: "UserId",
      })
      .promise();

    const widgetUserIds = new Set(widgetData.Items?.map((item: any) => item.UserId) || []);

    // Step 2: Get all users from tblmst_user
    const userData = await dynamo
      .scan({
        TableName: "tblmst_user",
        ProjectionExpression: "userloginid, username",
      })
      .promise();

    // Step 3: Filter out users who exist in widgetUserIds
    const filteredUsers = (userData.Items || []).filter(
      (user: any) => !widgetUserIds.has(user.userloginid)
    );

    // Send JSON response
    res.json([filteredUsers]);

  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
//This is to get the userlist
app.get("/api/getwidgetdrop", async (req, res) => {
  const { userid = null } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool.request().query(`Exec UspGetWidgetddn`);
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);

    const params = {
      TableName: "tblmstDashWidget"
    }
    const data = await dynamo.scan(params).promise();
    const mergedData: any = {};
    data.Items.forEach((s: any) => {
      const id = s.Id;
      if (!mergedData[id]) {
        mergedData[id] = {
          WidgetId: '',
          WidgetName: ''
        }
      }
      mergedData[id].WidgetId = s.WidgetId;
      mergedData[id].WidgetName = s.WidgetName;

    });
    const result = Object.values(mergedData);
    res.json([result]);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
app.get("/api/getDeleteaccess", verifyToken, async (req, res) => {
  const { userid = "" } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(`Exec [usp_deletedashaccess]  ${"'" + userid + "'"}`);
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);    
    const user = await dynamo.delete({
      TableName: "tbltrnDashboardWidgetData",
      Key: { UserId: userid }
    }).promise();
    res.json({ Data: "Deletedata" });
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
app.get("/api/getupdateaccess", verifyToken, async (req, res) => {
  const { userid = "" } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(`Exec [uspUpdateDashaccess]  ${"'" + userid + "'"}`);
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);
    const params = {
      TableName: "tbltrnDashboardWidgetData",
      FilterExpression: "UserId = :uid",
      ExpressionAttributeValues: {
        ":uid": userid,
      },
    };

    const result = await dynamo.scan(params).promise();
    res.json([result.Items]);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
//This is to get the userlist
app.get("/api/getuserlistddn", verifyToken, async (req, res) => {
  const { userid = null } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log("Connected to the database.");
    // const result = await pool
    //   .request()
    //   .query(`Exec [uspGetuserlistddn] ${"'" + userid + "'"}`);
    // console.log("SQL query executed successfully.");
    // res.json(result.recordsets);
    const params = {
      TableName: "tblmst_user",
      FilterExpression: "userloginid = :uid",
      ExpressionAttributeValues: {
        ":uid": userid,
      },
    };
    const data = await dynamo.scan(params).promise();
    const mergedData: any = {};
    data.Items.forEach((item: any) => {
      const contactId = item.userloginid;
      if (!mergedData[contactId]) {
        mergedData[contactId] = {
          userloginid: contactId,
          username: item.username,
        };
      }
    });
    const result = Object.values(mergedData);
    res.json([result])
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
app.post("/api/insertUserLayout", verifyToken, async (req, res) => {
  try {
    const { userId, layout } = req.body;
    if (!userId || !layout) {
      return res.status(400).json({ error: "userId and layout are required" });
    }
    const params = {
      TableName: "tblUserLayouts",
      Key: { UserId: Number(userId) }, // assumes UserId is the partition key
      UpdateExpression: "SET #layout = :layout",
      ExpressionAttributeNames: {
        "#layout": "layout",
      },
      ExpressionAttributeValues: {
        ":layout": layout,
      },
      ReturnValues: "ALL_NEW", // returns the final state after upsert
    };
    const result = await dynamo.update(params).promise();
    res.status(200).json({
      message: "User layout inserted/updated successfully",
      data: result.Attributes,
    });
  } catch (error) {
    console.error("Error inserting/updating user layout:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Insert/Update operation completed.");
  }
});

//This is to get the userlist
app.get('/api/getratecard', verifyToken, async (req, res) => {
  try {
    // const pool = await poolPromise;
    // console.log('Connected to the database.');
    // const result = await pool.request().query(`Exec proc_ratePerMinute`);
    // console.log('SQL query executed successfully.');
    // res.json(result.recordsets);

    const timezone: any = req.query.timezone;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const nextToken = req.query.nextToken ? JSON.parse(decodeURIComponent(req.query.nextToken as string)) : null;
    const allTimezones = moment.tz.names();
    const tz: any = allTimezones.includes(timezone) ? timezone : "Asia/Kolkata";
    const params: any = {
      TableName: 'tblRateCard',
      Limit: pageSize,
    };
    if (nextToken) {
      params.ExclusiveStartKey = nextToken; // DynamoDB continuation
    }
    const data = await dynamo.scan(params).promise();
    if (!data.Items || data.Items.length === 0) {
      return res.status(200).json({ message: "No records found" });
    }
    const mergedData: any = {};
    data.Items.forEach((item: any) => {
      const contactId = item.queueArn;
      if (!mergedData[contactId]) {
        mergedData[contactId] = {
          id: contactId,
          Names: contactId,
          queueArn: contactId,
          "contact_per_min_rate": null,
          "lex_per_sec_rate": null,
          "rate_source_info": null,
          "Rate_Plan_Effective_Date": null,
          "LastUpdated": null,
        };
      }

      const toTZ = (utcTime: any) =>
        utcTime ? moment(utcTime).tz(tz).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]") : null;

      if (item.contact_per_min_rate) mergedData[contactId].contact_per_min_rate = '$ ' + item.contact_per_min_rate;
      if (item.lex_per_sec_rate) mergedData[contactId].lex_per_sec_rate = '$ ' + item.lex_per_sec_rate;
      if (item.rate_source_info) mergedData[contactId].rate_source_info = item.rate_source_info;
      if (item.Rate_Plan_Effective_Date) mergedData[contactId].Rate_Plan_Effective_Date = item.Rate_Plan_Effective_Date;
      if (item.LastUpdated) mergedData[contactId].LastUpdated = item.LastUpdated;
      if (item.username) mergedData[contactId].username = item.username;
    });


    const queueUUIDs = new Set<string>();
    Object.values(mergedData).forEach((item: any) => {
      if (item.queueArn) queueUUIDs.add(item.queueArn);
    });

    let queues: Record<string, any> = {};
    if (queueUUIDs.size > 0) {
      const queueParams = {
        RequestItems: {
          TblmstQueue: {
            Keys: Array.from(queueUUIDs).map((uuid) => ({ UUID: uuid }))
          }
        }
      };
      const queueData = await dynamo.batchGet(queueParams).promise();
      queueData.Responses?.TblmstQueue?.forEach((q: any) => {
        queues[q.UUID] = { Names: q.Names };
      });
    }
    // Merge results back
    Object.values(mergedData).forEach((item: any) => {
      if (item.queueArn && queues[item.queueArn]) {
        item.Names = queues[item.queueArn].Names;
      }
    });
    let result = Object.values(mergedData);
    //  const result = Object.values(mergedData);
    res.status(200).json([
      result,
      [{ count: result.length }],
      result,
      {
        nextToken: data.LastEvaluatedKey
          ? encodeURIComponent(JSON.stringify(data.LastEvaluatedKey))
          : null
      }
    ]);

  } catch (error) {
    console.error('Error executing SQL query:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error });
  } finally {
    console.log('Closing the database connection.');
    //await sql.close();
  }
});
interface ContactData {
  queueInfo: {
    queueArn: string;

  };
  channel: string;
  initiationTimestamp: string;
  disconnectTimestamp: string;
  Lex_start?: string;
  Lex_end?: string;
  time: string;
  eventType: string;
}
interface RateCard {
  queueArn: string;
  contact_per_min_rate: number;
  lex_per_sec_rate: number;
}
interface QueueMap {
  UUID: string;
  Names: string;
}
//This is to get the userlist
app.get('/api/getbillingreport', verifyToken, async (req: any, res: any) => {
  const { currentPage = 0, perPage = 7, searchText = null, sval = null, fromdate = null, todate = null } = req.query;
  try {
    // const pool = await poolPromise;
    // console.log('Connected to the database.');
    // const result = await pool.request().query(`Exec proc_bilingReport ${currentPage},${perPage},${searchText !== null ? "'" + searchText + "'" : 'NULL'},${sval !== null ? "'" + sval + "'" : 'NULL'},${fromdate !== null ? "'" + fromdate + "'" : 'NULL'},${todate !== null ? "'" + todate + "'" : 'NULL'}`);
    // console.log('SQL query executed successfully.');
    // res.json(result.recordsets);

    // 1. Fetch contact data
    const contactDataResp = await dynamo
      .scan({
        TableName: TABLE_NAME,
        FilterExpression: "#t BETWEEN :from AND :to",
        ExpressionAttributeNames: { "#t": "eventTime" },
        ExpressionAttributeValues: {
          ":from": fromdate,
          ":to": todate,
        },
      })
      .promise();

    const contactData = (contactDataResp.Items || []) as ContactData[];

    // 2. Fetch rate cards
    const rateCardResp = await dynamo.scan({ TableName: "tblRateCard" }).promise();
    const rateCards = Object.fromEntries(
      (rateCardResp.Items || []).map((rc: RateCard) => [rc.queueArn, rc])
    );

    // 3. Fetch queue names
    //const queueResp = await dynamo.scan({ TableName: "TblmstQueue" }).promise();
    const queueResp = await dynamo.scan({
      TableName: "TblmstQueue",
      FilterExpression: "QueueType = :qt",
      ExpressionAttributeValues: { ":qt": "STANDARD" }
    }).promise();
    const queueNames = Object.fromEntries(
      (queueResp.Items || []).map((q: QueueMap) => [q.UUID, q.Names])
    );

    // 4. Aggregate in memory
    const grouped: Record<string, any> = {};

    for (const cd of contactData) {
      if (!cd.queueInfo) continue;
      if (!cd.disconnectTimestamp) continue;

      const key = `${cd.queueInfo.queueArn}#${cd.channel}`;
      if (!grouped[key]) {
        grouped[key] = {
          queueArn: cd.queueInfo.queueArn.split("queue/")[1],
          channel: cd.channel,
          total_calls: 0,
          total_call_duration_sec: 0,
          total_lex_duration_sec: 0,
          lex_invocations: 0,
        };
      }

      grouped[key].total_calls += 1;

      const callDuration =
        (new Date(cd.disconnectTimestamp).getTime() -
          new Date(cd.initiationTimestamp).getTime()) /
        1000;
      grouped[key].total_call_duration_sec += Math.max(0, callDuration);

      if (cd.eventType === "CONTACT_DATA_UPDATED") {
        // Handle the event type specific logic here
        cd.Lex_start = cd.time;
        cd.Lex_end = cd.time;
      }

      if (cd.Lex_start && cd.Lex_end) {
        const lexDuration =
          (new Date(cd.Lex_end).getTime() -
            new Date(cd.Lex_start).getTime()) /
          1000;
        grouped[key].total_lex_duration_sec += Math.max(0, lexDuration);
        grouped[key].lex_invocations += 1;
      }
    }

    // 5. Apply rate card + costs
    const results = Object.values(grouped).map((g: any) => {
      const rc = rateCards[g.queueArn] || { contact_per_min_rate: 0, lex_per_sec_rate: 0 };

      const contact_cost = (g.total_call_duration_sec / 60.0) * rc.contact_per_min_rate;
      const lex_cost = g.total_lex_duration_sec * rc.lex_per_sec_rate;
      const total_cost = contact_cost + lex_cost;

      return {
        id: AWS.util.uuid.v4(),
        Names: queueNames[g.queueArn] || g.queueArn,
        channel: g.channel,
        total_calls: g.total_calls,
        total_call_duration_sec: g.total_call_duration_sec,
        total_lex_duration_sec: g.total_lex_duration_sec,
        lex_invocations: g.lex_invocations,
        contact_cost_usd: `$${contact_cost.toFixed(3)}`,
        lex_cost_usd: `$${lex_cost.toFixed(3)}`,
        total_cost_usd: `$${total_cost.toFixed(3)}`,
      };
    });

    // 6. Apply search filter
    const filtered = searchText
      ? results.filter((r) => r.Names.toLowerCase().includes(searchText.toLowerCase()))
      : results;

    // 7. Pagination (in-memory)
    const paginated = filtered.slice(currentPage * perPage, (currentPage + 1) * perPage);

    res.json([
      paginated,
      [{ count: filtered.length }]
    ]);
  } catch (error) {
    console.error('Error executing SQL query:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error });
  } finally {
    console.log('Closing the database connection.');
    //await sql.close();
  }
});
app.get("/api/getcall", async (req: any, res: any) => {
  try {
    const timezone: any = req.query.timezone;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const nextToken = req.query.nextToken ? JSON.parse(decodeURIComponent(req.query.nextToken as string)) : null;
    const allTimezones = moment.tz.names();
    const tz: any = allTimezones.includes(timezone) ? timezone : "Asia/Kolkata";

    const params: any = {
      TableName: TABLE_NAME,
      Limit: pageSize,
    };

    if (nextToken) {
      params.ExclusiveStartKey = nextToken; // DynamoDB continuation
    }

    const data = await dynamo.scan(params).promise();

    if (!data.Items || data.Items.length === 0) {
      return res.status(200).json({ message: "No records found" });
    }

    const mergedData: any = {};

    data.Items.forEach((item: any) => {
      const contactId = item.contactId;

      if (!mergedData[contactId]) {
        mergedData[contactId] = {
          id: contactId,
          contactid: contactId,
          "Start Contact": null,
          "Add Call Info": null,
          "IVR START": null,
          connectedtoAgentTimestamp: null,
          disconnectTimeStamp: null,
          customerNumber: null,
          dnis: null,
          Names: null,
          agentname: null,
          username: null
        };
      }

      const toTZ = (utcTime: any) =>
        utcTime ? moment(utcTime).tz(tz).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]") : null;

      switch (item.eventType) {
        case "INITIATED":
          mergedData[contactId]["Start Contact"] = toTZ(item.eventTime);
          break;
        case "CONTACT_DATA_UPDATED":
          mergedData[contactId]["Add Call Info"] = toTZ(item.eventTime);
          break;
        case "CONNECTED_TO_SYSTEM":
          mergedData[contactId]["IVR START"] = toTZ(item.eventTime);
          break;
        case "CONNECTED_TO_AGENT":
          mergedData[contactId].connectedtoAgentTimestamp = toTZ(item.eventTime);
          break;
        case "DISCONNECTED":
          mergedData[contactId].disconnectTimeStamp = toTZ(item.eventTime);
          break;
      }
      if (item.tags?.CLI) mergedData[contactId].customerNumber = item.tags.CLI;
      if (item.tags?.DNIS) mergedData[contactId].dnis = item.tags.DNIS;
      if (item.queueInfo?.queueArn?.match(/queue\/([^/]+)/)?.[1])
        mergedData[contactId].Names = item.queueInfo.queueArn.match(/queue\/([^/]+)/)?.[1] || null;
      if (item.agentInfo?.agentArn?.match(/agent\/([^/]+)/)?.[1])
        mergedData[contactId].agentname = item.agentInfo.agentArn.match(/agent\/([^/]+)/)?.[1] || null;
      if (item.username) mergedData[contactId].username = item.username;
    });

    const result = Object.values(mergedData);
    res.status(200).json([
      result,
      [{ count: result.length }],
      result,
      {
        nextToken: data.LastEvaluatedKey
          ? encodeURIComponent(JSON.stringify(data.LastEvaluatedKey))
          : null
      }
    ]);
  } catch (err: any) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});


/////  Methods which are not using in the App
//not in use
app.get("/api/queuereport1", verifyToken, async (req, res) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
  } = req.query;
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool.request().query(`Exec [usp_GetQueueReport] `);
    console.log("SQL query executed successfully.");

    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
//not in use
app.get("/api/getqueueTrendhourly", verifyToken, async (req, res) => {
  const { queueid = null } = req.query;
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool
      .request()
      .query(`Exec [usp_getqueue_tren_hourly]  ${"'" + queueid + "'"}`);
    console.log("SQL query executed successfully.");

    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
//not in use
app.get("/api/getpiechart", verifyToken, async (req, res) => {
  const { queueid = "" } = req.query;
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool
      .request()
      .query(`Exec [usp_getPiechartReport]  ${"'" + queueid + "'"}`);
    console.log("SQL query executed successfully.");

    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// not in use
app.get("/api/RoutingProfileColumns", async (req, res) => {
  const { userid = "" } = req.query;
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool.request().query(`Exec UspRoutingProfileColumns`);
    console.log("SQL query executed successfully.");

    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// not in use
app.get("/api/uspgetstatusid", verifyToken, async (req, res) => {
  const { status = null } = req.query;
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool
      .request()
      .query(
        `Exec usp_getstatusid ${status !== null ? "'" + status + "'" : "NULL"}`
      );
    console.log("SQL query executed successfully.");
    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
//not in use
app.get("/api/getallstatus", verifyToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool.request().query(`Exec usp_getAllStatus `);
    console.log("SQL query executed successfully.");
    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// not in use
app.get("/api/getnotification", verifyToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    // const request = pool.request();
    // request.input('queuename', sql.VarChar, queuename);
    const result = await pool.request().query(`EXEC usp_getnotification`);
    console.log("SQL query executed successfully.");
    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// not in use
app.get("/api/marknotification", async (req, res) => {
  try {
    const { notid } = req.query as { notid?: string };
    const pool = await poolPromise;
    console.log("Connected to the database.");
    // const request = pool.request();
    // request.input('queuename', sql.VarChar, queuename);
    const result = await pool
      .request()
      .query(
        `EXEC usp_marknotification ${notid !== null ? "'" + notid + "'" : "NULL"
        }`
      );
    console.log("SQL query executed successfully.");
    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
//not in use
app.get("/api/contactattribute", verifyToken, async (req, res) => {
  try {
    const {
      currentPage = 1,
      perPage = 7,
      searchText = null,
      sval = null,
      fromdate = null,
      todate = null,
      queueid = null,
    } = req.query;
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool
      .request()
      .query(
        `Exec usp_getContactattribute  ${currentPage},${perPage},${searchText !== null ? "'" + searchText + "'" : "NULL"
        },${sval !== null ? "'" + sval + "'" : "NULL"},${fromdate !== null ? "'" + fromdate + "'" : "NULL"
        },${todate !== null ? "'" + todate + "'" : "NULL"},${queueid !== null ? "'" + queueid + "'" : "NULL"
        }`
      );
    console.log("SQL query executed successfully.");

    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// not in use
app.get("/api/gettable", async (req, res) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
    timerange = null,
  } = req.query;
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool.request().query(`Exec [usp_gettablename]`);
    console.log("SQL query executed successfully.");
    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// not in use
app.get("/api/getRawdata", async (req, res) => {
  const { tablename = null } = req.query;
  const cleanTablename = tablename;
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const query = `select * from ${cleanTablename}`;
    console.log(query);
    const result = await pool.request().query(query);
    console.log("SQL query executed successfully.");
    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// not in use                for drop down (Agent)
app.get("/api/customagent", async (req, res) => {
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool.request().query(`Exec usp_Reportname`);
    console.log("SQL query executed successfully.");
    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// not in use                 Getting the column as per selected table
app.get("/api/getreportcolumn", async (req, res) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
    todate = null,
  } = req.query;
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool.request().query(`Exec usp_getcolumn_custom ${"'" + sval + "'"}`);
    console.log("SQL query executed successfully.");
    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// not in use              for drop down (Group Type)
app.get("/api/grouptype", verifyToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool.request().query(`exec usp_getgrouptype`);
    console.log("SQL query executed successfully.");

    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// not in use
app.post("/api/customreportlist", async (req, res) => {
  let customdata = req.body;

  const pool = await poolPromise;
  const table = new sql.Table();
  table.columns.add("guid", sql.NVarChar(255));
  table.columns.add("reportname", sql.NVarChar(255));
  table.columns.add("columnname", sql.NVarChar(255));
  table.columns.add("groupby ", sql.NVarChar(255));
  table.columns.add("grouptype ", sql.NVarChar(255));

  // Define the CustomData interface
  interface CustomData {
    guid: string;
    customreport: string;
    selectedColumn: string;
    selectedgroupby: string;
    selectedgrouptype: string;
  }

  // Iterate over customdata
  customdata.forEach((row: CustomData) => {
    table.rows.add(
      row.guid,
      row.customreport,
      row.selectedColumn,
      row.selectedgroupby,
      row.selectedgrouptype
    );
  });
  try {
    // console.log("Connected to the database.");
    const pool = await poolPromise;
    const request = pool.request();
    // const request = new sql.Request();
    request.input("customdata", table);
    // result = await pool.request().query("Exec usp_get_Routingprofile");
    // console.log("SQL query executed successfully.");
    const result = await request.execute("usp_insertcustomreport");

    console.log("Data inserted successfully:", result);
    res
      .status(201)
      .json({
        message: "customreportlist added successfully",
        data: result.recordset,
      });
    // res.json(result.recordset);
  } catch (error) {
    console.error("Error inside getdbdata.getrouteprofile:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// not in use
app.get("/api/getagenthandle", verifyToken, async (req, res) => {
  const { loginId = null } = req.query;
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool.request().query(`Exec USP_getdataAHT ${loginId}`);
    console.log("SQL query executed successfully.");
    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
//  not in use
app.get("/api/getTotaltimeosagent", verifyToken, async (req, res) => {
  const { loginId = null } = req.query;
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool
      .request()
      .query(`Exec USP_getTotalTimeAgent ${loginId}`);
    console.log("SQL query executed successfully.");
    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// not in use
app.get("/api/gethistoricalagent", verifyToken, async (req, res) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
    timerange = null,
  } = req.query;
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool
      .request()
      .query(
        `Exec [usp_GetAlltimelyAgentReport] ${currentPage},${perPage},${searchText !== null ? "'" + searchText + "'" : "NULL"
        },${sval !== null ? "'" + sval + "'" : "NULL"},${timerange !== null ? "'" + timerange + "'" : "NULL"
        }`
      );
    console.log("SQL query executed successfully.");
    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// not in use
app.get("/api/Loginoutreport", verifyToken, async (req, res) => {
  try {
    const {
      currentPage = 1,
      perPage = 7,
      searchText = null,
      sval = null,
      fromdate = null,
      todate = null,
      queueid = null,
    } = req.query;
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool
      .request()
      .query(
        `Exec usp_getLoginoutreport ${currentPage},${perPage},${searchText !== null ? "'" + searchText + "'" : "NULL"
        },${sval !== null ? "'" + sval + "'" : "NULL"},${fromdate !== null ? "'" + fromdate + "'" : "NULL"
        },${todate !== null ? "'" + todate + "'" : "NULL"},${queueid !== null ? "'" + queueid + "'" : "NULL"
        }`
      );
    console.log("SQL query executed successfully.");
    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// not in use
app.get("/api/getbillingdata", verifyToken, async (req, res) => {
  try {
    const {
      currentPage = 1,
      perPage = 7,
      searchText = null,
      fromdate = null,
      todate = null,
    } = req.query;
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool
      .request()
      .query(
        `Exec usp_getCostAndUses  ${currentPage},${perPage},${searchText !== null ? "'" + searchText + "'" : "NULL"
        },${fromdate !== null ? "'" + fromdate + "'" : "NULL"},${todate !== null ? "'" + todate + "'" : "NULL"
        }`
      );
    console.log("SQL query executed successfully.");

    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});



////////////////////////////////////////////////////////////////////////////////////////////////

// genesys api data

// Getting routing profile
app.get("/api/genRoutingprofile", async (req, res) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
  } = req.query;
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool
      .request()
      .query(
        `EXEC usp_get_genRoutingprofile ${currentPage},${perPage},${searchText !== null ? "'" + searchText + "'" : "NULL"
        },${sval !== null ? "'" + sval + "'" : "NULL"}`
      );
    console.log("SQL query executed successfully.");
    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// get distinct names for dropdown
app.get("/api/gendropRoutingprofile", async (req, res) => {
  try {
    ////await sql.connect(config);
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool
      .request()
      .query(`Exec usp_get_genRoutingprofiletagent_drop`);
    console.log("SQL query executed successfully.");

    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
//Getitng the queueReport
app.get("/api/genqueueReport", async (req, res) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
  } = req.query;
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool
      .request()
      .query(
        `Exec [usp_get_genqueueReport] ${currentPage},${perPage},${searchText !== null ? "'" + searchText + "'" : "NULL"
        },${sval !== null ? "'" + sval + "'" : "NULL"}`
      );
    console.log("SQL query executed successfully.");
    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// for dropdown
app.get("/api/gendropqueueReport", async (req, res) => {
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool
      .request()
      .query(`Exec usp_get_genqueueReport_drop`);
    console.log("SQL query executed successfully.");

    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
//Getitng the userdata
app.get("/api/genUsermanagement", async (req, res) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
  } = req.query;

  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool
      .request()
      .query(
        `Exec [usp_GetgenUsermanagement] ${currentPage},${perPage},${searchText !== null ? "'" + searchText + "'" : "NULL"
        },${sval !== null ? "'" + sval + "'" : "NULL"}`
      );
    console.log("SQL query executed successfully.");

    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
app.get("/api/gendropUsermanagement", async (req, res) => {
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool.request().query(`Exec usp_getgenagent`);
    console.log("SQL query executed successfully.");

    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
app.get("/api/genLoginoutreport1", async (req, res) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
  } = req.query;
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool
      .request()
      .query(
        `Exec usp_getgenAgentReport ${currentPage},${perPage},${searchText !== null ? "'" + searchText + "'" : "NULL"
        },${sval !== null ? "'" + sval + "'" : "NULL"}`
      );
    console.log("SQL query executed successfully.");

    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
app.get("/api/genLoginoutreport", async (req, res) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
  } = req.query;
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool
      .request()
      .query(
        `Exec usp_gengetLoginoutreport ${currentPage},${perPage},${searchText !== null ? "'" + searchText + "'" : "NULL"
        },${sval !== null ? "'" + sval + "'" : "NULL"}`
      );
    console.log("SQL query executed successfully.");
    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
app.get("/api/genLoginoutreport", async (req, res) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
  } = req.query;
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool
      .request()
      .query(
        `Exec usp_gengetLoginoutreport ${currentPage},${perPage},${searchText !== null ? "'" + searchText + "'" : "NULL"
        },${sval !== null ? "'" + sval + "'" : "NULL"}`
      );
    console.log("SQL query executed successfully.");
    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
//Getting the metricAGENTREPORT
app.get("/api/genmetricAGENTREPORT", async (req, res) => {
  const {
    currentPage = 1,
    perPage = 7,
    searchText = null,
    sval = null,
    fromdate = null,
    todate = null,
  } = req.query;
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool
      .request()
      .query(
        `Exec [USP_his_AGENT_REPORT]  ${currentPage},${perPage},${searchText !== null ? "'" + searchText + "'" : "NULL"
        },${sval !== null ? "'" + sval + "'" : "NULL"},${fromdate !== null ? "'" + fromdate + "'" : "NULL"
        },${todate !== null ? "'" + todate + "'" : "NULL"}`
      );
    console.log("SQL query executed successfully.");
    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
// for drop down
app.get("/api/dropgenmetricAGENTREPORT", async (req, res) => {
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool
      .request()
      .query(`Exec USP_his_genAGENT_REPORT_drop`);
    console.log("SQL query executed successfully.");

    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
app.get("/api/genrealtimeData", async (req, res) => {
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const result = await pool.request().query("Exec usp_GetgenSkillReport");
    console.log("SQL query executed successfully.");
    res.json(result.recordset);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
app.get("/api/getgenagenthandle", async (req, res) => {
  const { loginId = null } = req.query;
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const request = pool.request();
    request.input("agent", sql.VarChar, loginId);
    const result = await request.query(`Exec USP_getdataAHT @agent`);
    console.log("SQL query executed successfully.");
    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});
app.get("/api/getTotaltimeosgenagent", async (req, res) => {
  const { loginId = null } = req.query;
  try {
    const pool = await poolPromise;
    console.log("Connected to the database.");
    const request = pool.request();
    request.input("agent", sql.VarChar, loginId);
    const result = await request.query("EXEC USP_getTotalTimeAgent @agent");
    console.log("SQL query executed successfully.");
    res.json(result.recordsets);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  } finally {
    console.log("Closing the database connection.");
  }
});

app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});
