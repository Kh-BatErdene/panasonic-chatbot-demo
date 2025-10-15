import logging
import os
import sys
from datetime import datetime
import watchtower  # type: ignore


class Logger:

    __instance = None

    @staticmethod
    def get_instance():
        """
        Create instance of this class
        """
        if Logger.__instance is None:
            Logger()
        return Logger.__instance

    # コンストラクタ
    def __init__(self):
        logger = logging.getLogger()
        os.environ["AWS_DEFAULT_REGION"] = "ap-northeast-1"

        self.process_name = "ecs"  # config["ENV_Logger_LogStreamName_prefix"]
        self.log_level = "INFO"
        self.log_date_str = datetime.now().strftime("%Y%m%d%H%M")

        # self.flag_debug = strtobool(config["ENV_Logger_Debug"])
        self.flag_debug = True

        if not logger.hasHandlers():
            self._logger_init()

        logger.setLevel(self.log_level)

        Logger.__instance = self

    # 初期化処理
    def _logger_init(self):
        if self.flag_debug:
            # ローカルで動作の場合、標準出力するハンドラをセット
            self.handler = logging.StreamHandler(stream=sys.stdout)
        else:
            # ECSで動作の場合、watchtowerでcloudwatchに出力するハンドラをセット
            # config["ENV_Logger_LogGroupName"]
            self.handler = watchtower.CloudWatchLogHandler(log_group="stg", stream_name="{0}_{1}".format(self.process_name, self.log_date_str))
        self.handler.setFormatter(fmt=logging.Formatter("%(asctime)s [%(levelname)s]:%(message)s"))
        logging.basicConfig(
            handlers=[
                self.handler,
            ],
            level=self.log_level,
        )

    # INFOレベルでログ出力を行います
    # 出力例：INFO:root:info
    def write_msg(self, *msg):
        logger = logging.getLogger()
        logger.info(msg)

    # WARNINGレベルでログ出力を行います
    # 出力例：WARNING:root:warning
    def write_warning(self, *msg):
        logger = logging.getLogger()
        logger.warning(msg)

    # ERRORレベルでログ出力を行います
    # 出力例：ERROR:root:error
    def write_error(self, *msg):
        logger = logging.getLogger()
        logger.error(msg)
