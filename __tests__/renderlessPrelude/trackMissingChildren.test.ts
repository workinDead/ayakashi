//tslint:disable
import "jest-extended";
//tslint:enable
import http from "http";
import {createStaticServer} from "../utils/startServer";
import {getRandomPort} from "../../src/utils/getRandomPort";
import {getAyakashiInstance} from "../utils/getRenderlessAyakashiInstance";

let staticServerPort: number;
let staticServer: http.Server;

jest.setTimeout(600000);

describe("select tests", function() {
    beforeAll(async function() {
        staticServerPort = await getRandomPort();
        staticServer = createStaticServer(staticServerPort,
            `
            <html>
                <head>
                    <title>test page</title>
                </head>
                <body>
                    <div class="container">
                        <a href="http://example.com" class="links">link1</a>
                        <div class="inner">
                            <div class="inner2">
                                <span data-value="1"></span>
                            </div>
                        </div>
                    </div>
                    <div class="container">
                        <a href="http://example.com" class="links">link2</a>
                    </div>
                    <div class="container">
                    </div>
                    <div class="container">
                        <a href="http://example.com" class="links">link3</a>
                        <div class="inner">
                            <div class="inner2">
                                <span data-value="1"></span>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
            `
        );
    });

    afterAll(function(done) {
        staticServer.close(function() {
            done();
        });
    });

    test("trackMissingChildren ON", async function() {
        const ayakashiInstance = await getAyakashiInstance();
        await ayakashiInstance.load(`http://localhost:${staticServerPort}`);
        ayakashiInstance
            .select("parentProp")
            .where({class: {eq: "container"}})
            .trackMissingChildren()
            .selectChild("childProp")
            .where({tagName: {eq: "A"}});
        const result = await ayakashiInstance.extract("childProp");
        expect(result).toEqual(["link1", "link2", "", "link3"]);
        await ayakashiInstance.__connection.release();
    });

    test("trackMissingChildren OFF", async function() {
        const ayakashiInstance = await getAyakashiInstance();
        await ayakashiInstance.load(`http://localhost:${staticServerPort}`);
        ayakashiInstance
            .select("parentProp")
            .where({class: {eq: "container"}})
            .selectChild("childProp")
            .where({tagName: {eq: "A"}});
        const result = await ayakashiInstance.extract("childProp");
        expect(result).toEqual(["link1", "link2", "link3"]);
        await ayakashiInstance.__connection.release();
    });

    test("trackMissingChildren cascades on child props", async function() {
        const ayakashiInstance = await getAyakashiInstance();
        await ayakashiInstance.load(`http://localhost:${staticServerPort}`);
        ayakashiInstance
            .select("parentProp")
            .where({class: {eq: "container"}})
            .trackMissingChildren()
                .selectChild("inner")
                .where({class: {eq: "inner"}})
                    .selectChild("inner2")
                    .where({class: {eq: "inner2"}})
                        .selectChild("childProp")
                        .where({tagName: {eq: "span"}});
        const result = await ayakashiInstance.extract("childProp", "data-value");
        expect(result).toEqual(["1", "", "", "1"]);
        await ayakashiInstance.__connection.release();
    });
});
