import { configManager, ServerConfig } from '../config-manager.js';
import { SetConfigValueArgsSchema } from './schemas.js';
import { getSystemInfo } from '../utils/system-info.js';
import { currentClient } from '../server.js';

/**
 * Get the entire config including system information
 */
export async function getConfig() {
  console.error('getConfig called');
  try {
    const config = await configManager.getConfig();
    
    // Add system information and current client to the config response
    const systemInfo = getSystemInfo();
    const configWithSystemInfo = {
      ...config,
      currentClient,
      systemInfo: {
        platform: systemInfo.platform,
        platformName: systemInfo.platformName,
        defaultShell: systemInfo.defaultShell,
        pathSeparator: systemInfo.pathSeparator,
        isWindows: systemInfo.isWindows,
        isMacOS: systemInfo.isMacOS,
        isLinux: systemInfo.isLinux,
        docker: systemInfo.docker,
        examplePaths: systemInfo.examplePaths
      }
    };
    
    console.error(`getConfig result: ${JSON.stringify(configWithSystemInfo, null, 2)}`);
    return {
      content: [{
        type: "text",
        text: `Current configuration:\n${JSON.stringify(configWithSystemInfo, null, 2)}`
      }],
    };
  } catch (error) {
    console.error(`Error in getConfig: ${error instanceof Error ? error.message : String(error)}`);
    console.error(error instanceof Error && error.stack ? error.stack : 'No stack trace available');
    // Return empty config rather than crashing
    return {
      content: [{
        type: "text",
        text: `Error getting configuration: ${error instanceof Error ? error.message : String(error)}\nUsing empty configuration.`
      }],
    };
  }
}

/**
 * Set a specific config value
 */
export async function setConfigValue(args: unknown) {
  console.error(`setConfigValue called with args: ${JSON.stringify(args)}`);
  try {
    const parsed = SetConfigValueArgsSchema.safeParse(args);
    if (!parsed.success) {
      console.error(`Invalid arguments for set_config_value: ${parsed.error}`);
      return {
        content: [{
          type: "text",
          text: `Invalid arguments: ${parsed.error}`
        }],
        isError: true
      };
    }

    try {
      // Parse string values that should be arrays or objects
      let valueToStore: any = parsed.data.value;
      
      // If the value is a string that looks like an array or object, try to parse it
      if (typeof valueToStore === 'string' && 
          (valueToStore.startsWith('[') || valueToStore.startsWith('{'))) {
        try {
          valueToStore = JSON.parse(valueToStore);
          console.error(`Parsed string value to object/array: ${JSON.stringify(valueToStore)}`);
        } catch (parseError) {
          console.error(`Failed to parse string as JSON, using as-is: ${parseError}`);
        }
      }

      // Special handling for known array configuration keys
      if (parsed.data.key === 'allowedDirectories' || parsed.data.key === 'blockedCommands') {
        if (Array.isArray(valueToStore)) {
          // Already an array, keep as is
        } else if (typeof valueToStore === 'string') {
          try {
            const parsedValue = JSON.parse(valueToStore);
            if (Array.isArray(parsedValue)) {
              valueToStore = parsedValue;
            } else {
              // If parsing succeeded but not an array, wrap in array
              valueToStore = [String(parsedValue)];
            }
          } catch (parseError) {
            console.error(`Failed to parse string as array for ${parsed.data.key}: ${parseError}`);
            // If parsing failed, check if it looks like a single value (no brackets)
            if (!valueToStore.includes('[')) {
              valueToStore = [valueToStore];
            } else {
              // Fallback: convert to string array with single item
              valueToStore = [valueToStore];
            }
          }
        } else if (valueToStore !== null) {
          // Convert non-string, non-null values to string array
          valueToStore = [String(valueToStore)];
        } else {
          // Handle null case
          valueToStore = [];
        }
      }

      await configManager.setValue(parsed.data.key, valueToStore);
      // Get the updated configuration to show the user
      const updatedConfig = await configManager.getConfig();
      console.error(`setConfigValue: Successfully set ${parsed.data.key} to ${JSON.stringify(valueToStore)}`);
      return {
        content: [{
          type: "text",
          text: `Successfully set ${parsed.data.key} to ${JSON.stringify(valueToStore, null, 2)}\n\nUpdated configuration:\n${JSON.stringify(updatedConfig, null, 2)}`
        }],
      };
    } catch (saveError: any) {
      console.error(`Error saving config: ${saveError.message}`);
      // Continue with in-memory change but report error
      return {
        content: [{
          type: "text", 
          text: `Value changed in memory but couldn't be saved to disk: ${saveError.message}`
        }],
        isError: true
      };
    }
  } catch (error) {
    console.error(`Error in setConfigValue: ${error instanceof Error ? error.message : String(error)}`);
    console.error(error instanceof Error && error.stack ? error.stack : 'No stack trace available');
    return {
      content: [{
        type: "text",
        text: `Error setting value: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}