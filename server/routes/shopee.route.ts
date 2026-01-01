import express from "express";
import axios from "axios";
import XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { refreshCookie } from "../services/shoppee-services.service";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

router.post("/transform-link", async (req, res) => {
  try {
    const { link } = req.body;

    let data = `{"operationName":"batchGetCustomLink","query":"\\n    query batchGetCustomLink($linkParams: [CustomLinkParam!], $sourceCaller: SourceCaller){\\n      batchCustomLink(linkParams: $linkParams, sourceCaller: $sourceCaller){\\n        shortLink\\n        longLink\\n        failCode\\n      }\\n    }\\n    ","variables":{"linkParams":[{"originalLink":"${link}","advancedLinkParams":{"subId1":"j99"}}],"sourceCaller":"CUSTOM_LINK_CALLER"}}`;

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://affiliate.shopee.vn/api/v3/gql?q=batchCustomLink",
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "af-ac-enc-dat": "70d1b1fcf1abbeb6",
        "af-ac-enc-sz-token":
          "9rsD0YiBuBShnVw0xLDBWA==|WzZWuGXyCumpIkv9q/S9uqE3P9arVcgB/wQ+rnHQ9das4axOQWjJ3lyRjrOxxIP3x/5Pz6+aDYo1AA==|Msg7T/CPlPe6+h6v|08|3",
        "affiliate-program-type": "1",
        "content-type": "application/json; charset=UTF-8",
        "csrf-token": "cJJuDdPv-Bbq9P9cp9LUbOWcW18n7oJtMiSg",
        origin: "https://affiliate.shopee.vn",
        priority: "u=1, i",
        referer: "https://affiliate.shopee.vn/offer/custom_link",
        "sec-ch-ua":
          '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "x-sap-ri": "9e5756693f02ea40b2ae43310501c220169acec1a1b5bf439023",
        "x-sap-sec":
          "LJL/msfDowfN4xIz5wlz5xvzuwmr5ilz7wyd5jBzOplV5ZlzFwmx5jIzUwlR5aszK2mZ5xvzMwlJ5bxz+wmO5C/zJplw5bIzcuyW5YDzWwl25CKz/wlr5xWzF2l65jnz92yz5GDzNwmI5gEz4wmj5Z/zDpms5gxzrplp5jDz8wyN5GxzLwmP5wlzjwxz5wlz5wjTUona5wlz0XwhUDRX52lz5wlzVI7n+EUz52lzpwCz5xRqfjWz5YEsdwxz5wlzWmKz5jls5wmhjnIm5wlzf0HD7wlz5zQm5wlA5plz3J4Go2lz5ygw5ulzewCz5wlzK8e0XFqd5wlzQAZFiev65ulz5wmWVsDy5wl1Xpynw5r9zzNc5bVu52lz5wml+ull5wzz5ulz5CpGwZQq75uRacjq5wltjmKz5wyjr1K36RuB8qm+1SgaWXWO46IvXTgAtCqPlaDsjEikDir7ZTVVM2Svg6OOkuc9uB8bZwIPy6YSy/jvwo9cs/DJYw7Nohmm7CagTdFK1fIA+6hONU4JaCE4ZoGJhlXtkL/JdtR/b48e8GyfEDnikkP26tgTIfNLt6IBMdP7yWb8lcC1STrZaWsYB4rMb7C+/5b2jrlQtBavMoa/loTiVBIpigi8JkMZH+ab+8RDG2WA7lhU03BBm1PwAWlksreVDr6+JG8R/2hVeEsV9hZI2l8XT4EwKW6p5iH8jCHL+JwPizOgf4+IPcbcPdd85wQz5wzRxAhiCupZT2Dz5wyDIh78Vulz5wmWjQj2obJuGvq14Gr64ffebbnYEhk0pejt2bDJnN4ICmlXvMU2nZme7aPWo0zd/09uZSov7sW6Xbrriqw7qzbHqTd1MCZMfgkVIWiDB8O3jYJZY5y8BN0kypLHvppqxWuBq8vQXK+oZ6fGnFu40foBm/uxOR18tuNqWaQLsb/QX5d2eSLqumRTJvt/OqQcrRMwGeMGe6so96aQMOb46XZR5wlz4wlz5fmzVbBY5wlz7l5sq44Yh6JMClosgplz5wlz5wlz5wlzd2lz5Yiz9R768sIpHfSob5iv+nCWA+TMVyeROC5LAJYlfEfCoW5/1M5x7Yfkx+4OlFLMr/5LTmdtmEfth8dHbr+vR0QcnWR7Akxz5wlz5wlz5wlzrplz5Ci6qJoyj/WaoFycxNbx2qchtfszSwlz5ZApqOj9FtPiKD2cuj+8HYJcGI5BFrI+NCjHbOobgLZaol0Jbplz5wlH5wlz3DR6ar0CHVM6CJNcDjBBPUNouBjtAhgxol6Bbd7Y0oEIGOq4D4EQQZwOqmAVFtC17PkOb4oZEqIz5wlzJwlz5jYw9IhPt0Fo5wlz5wlz5wlu5wlzrb134n7TWPmk6j3ZzjnBm6qbgf8YUmLYK+zubpQz5wmAldigxWKXKuQz5wlkoegd6UFN62lz5wl=",
        "x-sz-sdk-version": "1.12.21",
        Cookie:
          "_gcl_au=1.1.1706188310.1761497653; SPC_F=RUSIZPqfNtz5exuUYHBfk8bZglsK8Llp; REC_T_ID=66367777-b28c-11f0-a2a1-3a750941605b; _fbp=fb.1.1761497653548.333186103250079393; SPC_CLIENTID=UlVTSVpQcWZOdHo1qfuvtntatniqzqcd; SC_DFP=aXfHQJFcfSldxSgPoXJSYnCdMvjnvYFV; _hjSessionUser_868286=eyJpZCI6IjI3NTQ0ZTkzLTRjYjgtNTU0Ny04NzE0LWU5NzUzOTY1YTc3NyIsImNyZWF0ZWQiOjE3NjE1MzE2MjQyMTcsImV4aXN0aW5nIjp0cnVlfQ==; _gid=GA1.2.15263739.1767249675; language=vi; csrftoken=zClI4l2otzhTczuy5tssxXvNKnjWjfMQ; SPC_SI=8JFTaQAAAABRY0xKMW1iaA/nCgAAAAAAS2Rzdk5LdWk=; SPC_ST=.OHVCVzFPWFk1UjR2R3FBQ3L0QibwLLnfgvlrJoQ5/t1WU+Qj79QRUYxJaB9YeAcev3B5BmlYNIgnqrAIRfVAOrZs1nScgbSaznblcpWHK7utHBPC42rMSyodAPiDjyAF83DrBXzFqLzkWqQ8CU5ga1j8ofhXwWIdVd9OFLzyAwjZghIMQFbg2zSH+uZlOwt2Rr46FG3hXcws/uUIny/MQvvy8VuTT/ckHPWM7tTpU/X4zGxufi3tSFwSgDUKkQIO7xrCZYkbogCxWRO4PS57dg==; _QPWSDCXHZQA=df36c7d0-21c0-4220-f394-01f1dcd163a3; REC7iLP4Q=819e9752-2567-4d05-9151-1d5c6ca2ccc4; _sapid=969af454818da23d93c73856d46d76ccc5f7be7139eb527d7cfe219a; link_social_media_227001371=1; SPC_U=227001371; _ga_FV78QC1144=GS2.1.s1767249921$o1$g1$t1767250000$j60$l0$h0; SPC_R_T_ID=EcUF2f8ifxnhULDiXLr6/gXhs8c05HYWdLts+G/BEy0YnuUI/ffnm1sL/E7DeHJbLguQenVbFLKDmaUfo7t9od36zJf5hNZCfxX4la/UiZa34eBYQoxrjeRxOH2fbQAbFDtwpaNB0bEMPHhejSMV+fDH7+VTpC/f/C15B+tn+r0=; SPC_R_T_IV=U1JnQW9kT3dRc2QwWVMzWA==; SPC_T_ID=EcUF2f8ifxnhULDiXLr6/gXhs8c05HYWdLts+G/BEy0YnuUI/ffnm1sL/E7DeHJbLguQenVbFLKDmaUfo7t9od36zJf5hNZCfxX4la/UiZa34eBYQoxrjeRxOH2fbQAbFDtwpaNB0bEMPHhejSMV+fDH7+VTpC/f/C15B+tn+r0=; SPC_T_IV=U1JnQW9kT3dRc2QwWVMzWA==; SPC_CDS_CHAT=173738e0-58c0-43ef-9cf8-b19ed95a95ae; SPC_SC_SESSION=goU0mBmZh7Ig56aQ+wNRFauE64YKVguO1eXOO7kFxVkq9nFuc82lUCAiKABh5I08ZDglGSlQRCxw/GFVGrdZ3cNr37bj8jzj5bMIybltALZzSz34xM3wv1dF6jyiD7SJMpJfrEwXfGu2UOHNaqTQr7lePS3N16ZHd5ggsGy0bDHGNBwIZxPo1DdPKx/6xdZJju4Q20EpZIngv5clIwuNBG8M3LLbvOg/vwrnjJEeFdMb302keayCPLv1343lZz7J17P/dRAfChRpzE8N3FKAOOA==_1_227001371; SPC_SC_MAIN_SHOP_SA_UD=0; SPC_STK=MLK9iVgkTT0zq/cgb6qTl1iBC4LCn9cs1gzkekbLnTdaGS5UuijrbiZydX9w6kiqWdNVwIUiBN70hJMRr2YVGZJpZjGPGAi4boxfSyz3R7f/akDVjAa/zbAAjGCh4uJ6SRcB/vP0gxetaIMJMdJ6VYzPPXqbKt9+ZsS0SHgX9mSehtmAmd3aFKSg0hbVD1ysLludK+I9UTgFU4ZAWaHQqzV6FOZ8pqzNCTXFxP4tUZz72YdN0XZyA9sTyowKuT1lqOcTJVXR1OWqhLUqgEjk0fpYBfxSe6nNHGkyAn+Rpsvav/MLyQhag80SqGfP6ofYEd649HqRgc0GAgXIBn5wXiSB5ZVvLyLfn656wIcp+8tJbY6CdIxmDqz4Zdxu1R0/8okKgR1wJwXbMdJwUF2GtalXZ1xSuXJinMJKtWq0VuiFkQ1k6x0rYrtsWgQz3+RTot874HZdo5ImxMymo2sr62L2ND//b0hcXzU+cHd+MWBszzqyOQQ7sECs+9t+9hh2; CTOKEN=nW41SebiEfCFTHJMe%2FeKLw%3D%3D; shopee_webUnique_ccd=Rxht6El9Matf0Pdmzrymyw%3D%3D%7CUzZWuGXyCumpIkv9q%2FS9uqE3P9arVcgB%2FwQ%2Brrts69es4axOQWjJ3lyRjrOxxIP3x%2F5Pz6%2BaDYo%3D%7CMsg7T%2FCPlPe6%2Bh6v%7C08%7C3; ds=7f6c01073774876575810941254cad74; _med=affiliates; _ga_4GPP1ZXG63=GS2.1.s1767266080$o10$g1$t1767266156$j60$l1$h1284490551; AMP_TOKEN=%24NOT_FOUND; _ga=GA1.2.1374448673.1761497653; _dc_gtm_UA-61914164-6=1; SPC_EC=.aGJma1pxQXFudDUzNGlNUDF3AR2B/xYWkz+aEXM57oxxrQqB3EycVu1ypvYlObc+KcMD2gg1uhztDPNdXJpFwjxaEKaLQ1DGi4nqeLadIMv6vvb4z1lk5dDdyOgQZS2EAY+cF8riL+jIoCykuc7x/7F1nu/n4j9OklXIbZDOIiAfU2Vwj8qhbnMI0HJxW/xhrbZ2MssbDpyUMyhTh/wd72WyrzY+RVkmoa3+uQ8HsiYfpcblmeMZ62Szs5FwRKkoHJmswboADisbQdFDmEH/6g==; _hjSession_868286=eyJpZCI6IjUxYTY4MjQwLWM2NzgtNGQ2OC04MTFhLTY0ZGY4NmE3N2NmMCIsImMiOjE3NjcyNjYxNTc2MTMsInMiOjAsInIiOjAsInNiIjowLCJzciI6MCwic2UiOjAsImZzIjowLCJzcCI6MX0=",
      },
      data: data,
    };

    const response = await axios.request(config);

    const cookies = await refreshCookie();
    console.log("Refreshed cookies after error:", cookies);

    res.json({ data: response.data.data });
  } catch (error) {
    console.error("Shopee API error:", error);
    res.status(500).json({ error: "Failed to transform link" });
  }
});

router.post("/save-info", async (req, res) => {
  try {
    const {
      info: {
        orderId,
        phone,
        bankName,
        accountNumber,
        accountName,
        affiliateLink,
      },
    } = req.body;

    // Path to the Excel file
    const filePath = path.join(__dirname, "../customer.xlsx");

    let workbook: XLSX.WorkBook;
    let worksheet: XLSX.WorkSheet;

    // Check if the file exists
    if (fs.existsSync(filePath)) {
      // Read existing file
      workbook = XLSX.readFile(filePath);
      worksheet = workbook.Sheets["Customers"];
    } else {
      // Create new workbook and worksheet
      workbook = XLSX.utils.book_new();
      worksheet = XLSX.utils.aoa_to_sheet([
        [
          "Mã Đơn Hàng",
          "Số Điện Thoại",
          "Tên Ngân Hàng",
          "Số Tài Khoản",
          "Tên Chủ Tài Khoản",
          "Ngày tạo",
        ],
      ]);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    }

    // Convert worksheet to JSON to get existing data
    const data = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
    }) as unknown[][];

    // Add new row
    const newRow = [
      orderId,
      phone,
      bankName,
      accountNumber,
      accountName,
      new Date().toISOString(),
    ];
    data.push(newRow);

    // Convert back to worksheet
    const newWorksheet = XLSX.utils.aoa_to_sheet(data);
    workbook.Sheets["Customers"] = newWorksheet;

    // Write to file
    XLSX.writeFile(workbook, filePath);

    console.log("Customer info saved to Excel:", {
      phone,
      bankName,
      accountNumber,
      accountName,
      affiliateLink,
    });

    res.json({ message: "Info saved successfully", data: newRow });
  } catch (error) {
    console.error("Error saving info:", error);
    res.status(500).json({ error: "Failed to save info" });
  }
});

router.get("/view-customer-data", (req, res) => {
  try {
    const filePath = path.join(__dirname, "../customer.xlsx");

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets["Customers"];
    const data = XLSX.utils.sheet_to_json(worksheet);

    res.json({ data });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to read file" });
  }
});

export default router;
