FROM rabbitmq:latest

# 複製配置文件
COPY conf/rabbitmq/rabbitmq.conf /etc/rabbitmq/rabbitmq.conf

# 啟用插件
RUN rabbitmq-plugins enable --offline rabbitmq_mqtt rabbitmq_web_mqtt

# 直接啟動 RabbitMQ
CMD ["rabbitmq-server"]