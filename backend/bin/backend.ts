#!/usr/bin/env node
import { initStack } from "./init-stack";
import "source-map-support/register";

import { AppSyncBasedServiceProps } from "../lib/backend-stack";

const { app, stackNameWithEnv, stackProps, context } = initStack();

new AppSyncBasedServiceProps(app, stackNameWithEnv, stackProps);
