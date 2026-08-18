const fs = require("fs");
const filePath = "c:/Users/NID-ThinkPad X13/Documents/Leave-Management/Leave-Management_frontend/app/dashboard/hr/leave-summary/page.tsx";
let content = fs.readFileSync(filePath, "utf-8");
const idx1 = content.indexOf("=======\r\n");
const idx2 = content.indexOf(">>>>>>> 278a4765ce02a7aa0ece327b9c5c8574ef37fbaa\r\n");
if (idx1 !== -1 && idx2 !== -1) {
  content = content.substring(0, idx1) + content.substring(idx2 + 50);
  fs.writeFileSync(filePath, content, "utf-8");
  console.log("Removed conflict block successfully");
} else {
  // try \n
  const idx1n = content.indexOf("=======\n");
  const idx2n = content.indexOf(">>>>>>> 278a4765ce02a7aa0ece327b9c5c8574ef37fbaa\n");
  if (idx1n !== -1 && idx2n !== -1) {
    content = content.substring(0, idx1n) + content.substring(idx2n + 49);
    fs.writeFileSync(filePath, content, "utf-8");
    console.log("Removed conflict block successfully (LF)");
  } else {
    console.log("Could not find markers", idx1, idx2, idx1n, idx2n);
  }
}

