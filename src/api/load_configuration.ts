import {
  IRunEnvironment,
  IResolvedConfiguration,
  ILoadConfigurationOptions,
} from './types'
import { locateFile } from '../configuration/locate_file'
import {
  DEFAULT_CONFIGURATION,
  fromFile,
  mergeConfigurations,
} from '../configuration'
import { validateConfiguration } from '../configuration/validate_configuration'
import { convertConfiguration } from './convert_configuration'
import { mergeEnvironment } from './environment'
import { ILogger } from '../logger'
import { Logger } from './logger'

/**
 * Load user-authored configuration to be used in a test run.
 *
 * @public
 * @param options - Coordinates required to find configuration.
 * @param environment - Project environment.
 */
export async function loadConfiguration(
  options: ILoadConfigurationOptions = {},
  environment: IRunEnvironment = {}
): Promise<IResolvedConfiguration> {
  const { cwd, stderr, env, debug } = mergeEnvironment(environment)
  const logger: ILogger = new Logger(stderr, debug)
  const configFile = options.file ?? locateFile(cwd)
  if (configFile) {
    logger.debug.log(`Configuration will be loaded from "${configFile}"`)
  } else {
    logger.debug.log('No configuration file found')
  }
  const profileConfiguration = configFile
    ? await fromFile(cwd, configFile, options.profiles)
    : {}
  const original = mergeConfigurations(
    DEFAULT_CONFIGURATION,
    profileConfiguration,
    options.provided
  )
  logger.debug.log('Resolved configuration:', original)
  validateConfiguration(original)
  const runnable = await convertConfiguration(original, env)
  return {
    useConfiguration: original,
    runConfiguration: runnable,
  }
}
